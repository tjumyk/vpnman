import logging
import re
import socket
from datetime import datetime
from threading import Lock
from typing import List

from error import BasicError

logger = logging.getLogger(__name__)


class ManagementToolError(BasicError):
    pass


class ManagementSession:
    _supported_management_interface_versions = {'1'}

    def __init__(self, _socket: socket.socket, buffer_size: int):
        self._socket = _socket
        self._buffer_size = buffer_size

        # use a flag to track if the socket has been closed
        self._is_closed = False
        # use a lock to avoid two commands executing at the same time
        self._cmd_lock = Lock()

        # verify welcome message
        self._verify_welcome()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.exit()

    def _send(self, data: str):
        if self._is_closed:
            raise ManagementToolError('session has been closed')
        if not data:
            raise ManagementToolError('data to send must not be empty')

        if data[-1] != '\n':
            data += '\n'  # append the trailing newline character to complete the data

        data_bytes = data.encode()
        logger.debug("SendAll: %r", data_bytes)
        self._socket.sendall(data_bytes)

    def _recv(self, multilines: bool = False, multilines_termination: str = 'END',
              ignore_realtime_messages: bool = True, raise_on_error: bool = True,
              auto_remove_success_header: bool = True) -> str:
        if self._is_closed:
            raise ManagementToolError('session has been closed')

        ord_newline = ord('\n')  # index of newline character for byte comparison
        realtime_header = re.compile(r'>[\w\-]+:')
        success_header = 'SUCCESS:'
        error_header = 'ERROR:'

        # keep receiving data until we have enough lines in 'lines'
        lines = []
        lines_buffer = b''
        while True:
            block = self._socket.recv(self._buffer_size)
            logger.debug("Recv: %r", block)
            if not block:  # Empty data received. Is this possible?
                continue
            lines_buffer += block
            if block[-1] != ord_newline:  # keep receiving data if there is an incomplete line at the end of the buffer
                continue

            stop_receiving = False
            for line in lines_buffer.splitlines():
                line = line.decode()
                is_realtime = bool(realtime_header.match(line))
                is_error = line.startswith(error_header)

                if is_error:
                    stop_receiving = True  # no matter if it's in multilines mode or not
                    if raise_on_error:
                        error = line[len(error_header):].lstrip()  # remove the extra leading whitespace
                        raise ManagementToolError('error received', error)

                if multilines:
                    if line == multilines_termination:
                        stop_receiving = True
                        # do not keep it
                    else:
                        if not is_realtime or not ignore_realtime_messages:
                            lines.append(line)
                else:
                    if not is_realtime or not ignore_realtime_messages:
                        # auto_remove_success_header is only applicable to single-line mode
                        if auto_remove_success_header and line.startswith(success_header):
                            # NOTICE: you are MUTATING the content of this line! Make sure this doesn't break logic in
                            # other places
                            line = line[len(success_header):].lstrip()  # remove the extra leading whitespace
                        lines.append(line)
                        stop_receiving = True
            lines_buffer = b''  # reset lines buffer
            if stop_receiving:
                break

        # if there is at least one line, add a empty string to the list to enforce a trailing newline in the final
        # joined output
        if lines:
            lines.append('')
        return '\n'.join(lines)

    def _verify_welcome(self):
        # Receive the welcome info message from the server and check if the version is supported.
        # This should be executed before any other RECV because the welcome info is the first realtime message received
        # passively after the connection is established.
        welcome = self._recv(ignore_realtime_messages=False)
        match = re.search(r'management interface version (\S+)', welcome, re.IGNORECASE)
        if not match or match.group(1) not in self._supported_management_interface_versions:
            self.exit()  # exit first
            raise ManagementToolError('Unsupported management interface version')

    def exit(self):
        with self._cmd_lock:
            if self._is_closed:  # if call exit() after session is closed, simply ignore it
                return
            try:
                self._send('exit')
            except (socket.timeout, socket.error) as e:
                logger.warning('send exit failed', exc_info=e)
            finally:
                # no matter if 'exit' was sent successfully or not, try to close the socket
                try:
                    self._socket.shutdown(socket.SHUT_RDWR)
                    self._socket.close()
                except (socket.timeout, socket.error) as e:
                    logger.warning('send close failed', exc_info=e)
                finally:
                    # always release the reference. GC will also close the socket if it was not closed successfully.
                    self._socket = None
                self._is_closed = True  # mark session as closed in any case

    def version(self) -> dict:
        with self._cmd_lock:
            self._send('version')
            result = {}
            for line in self._recv(multilines=True).splitlines():
                k, v = line.split(':', 1)
                k, v = k.strip(), v.strip()
                if k == 'OpenVPN Version':
                    result['openvpn'] = v
                elif k == 'Management Version':
                    result['management'] = v
            return result

    def state(self, history=None) -> List[dict]:
        with self._cmd_lock:
            if history:
                cmd = 'state %s' % history
            else:
                cmd = 'state'  # current state only
            self._send(cmd)

            results = []
            for line in self._recv(multilines=True).splitlines():
                parts = line.split(',')
                results.append({
                    'time': int(parts[0]),
                    'state': parts[1],
                    'description': parts[2],
                    'local_ip': parts[3],
                    'remote_ip': parts[4]
                })
            return results

    def status(self) -> dict:
        with self._cmd_lock:
            self._send('status 3')  # use version 3 format
            data = self._recv(multilines=True)

            int_column_names = {'Bytes Received', 'Bytes Sent', 'Client ID', 'Peer ID'}
            undef_to_null_column_names = {'Username'}
            time_t_suffix = ' (time_t)'

            results = {}
            table_defs = {}
            for line in data.splitlines():
                parts = line.split('\t')
                header = parts[0]
                params = parts[1:]

                if header == 'TITLE':
                    continue  # openvpn version string, ignored
                if header == 'TIME':
                    continue  # current time, ignored

                if header == 'HEADER':
                    table_defs[params[0]] = params[1:]
                elif header == 'GLOBAL_STATS':
                    results['global_stats'] = params  # param syntax is not clear
                else:
                    # tables defined at realtime
                    table_def = None
                    for k, v in table_defs.items():
                        if k == header:
                            table_def = v
                            break
                    if table_def is None:
                        logger.warning('unknown header: %s', header)

                    # put row data into table.
                    # int conversion is applied in some columns.
                    # 'UNDEF' is replaced with None in some columns.
                    table_key_lower = header.lower()
                    table = results.get(table_key_lower)
                    if table is None:
                        table = []
                        results[table_key_lower] = table
                    row = {}
                    for k, v in zip(table_def, params):
                        if k in int_column_names:
                            v = int(v)
                        if k in undef_to_null_column_names and v == 'UNDEF':
                            v = None
                        row[k] = v

                    # merge the dual-format (str+int) time columns into a single column with datetime type
                    merge_time_columns = []
                    for k, v in row.items():
                        if k.endswith(time_t_suffix):
                            short_key = k[:-len(time_t_suffix)]
                            if short_key in row:
                                _time = datetime.utcfromtimestamp(int(v))
                                merge_time_columns.append((short_key, k, _time))
                    for short_key, key, value in merge_time_columns:
                        row[short_key] = value
                        del row[key]

                    # convert column names to python style
                    row = {k.replace(' ', '_').lower(): v for k, v in row.items()}
                    table.append(row)
            return results

    def load_stats(self) -> dict:
        with self._cmd_lock:
            self._send('load-stats')
            data = self._recv()

            results = {}
            for column in data.split(','):
                k, v = column.split('=', 1)
                try:
                    v = int(v)
                except (TypeError, ValueError):
                    pass
                results[k] = v
            return results


class ManagementTool:
    _server_host = 'localhost'
    _server_port = 7505
    _socket_timeout = 3  # seconds
    _socket_buffer_size = 4096

    @classmethod
    def init(cls, config: dict):
        cls._server_host = config.get('server_host', cls._server_host)
        cls._server_port = config.get('server_port', cls._server_port)
        cls._socket_timeout = config.get('socket_timeout', cls._socket_timeout)
        cls._socket_buffer_size = config.get('socket_buffer_size', cls._socket_buffer_size)

    @classmethod
    def connect(cls) -> ManagementSession:
        try:
            _socket = socket.create_connection((cls._server_host, cls._server_port), cls._socket_timeout)
            return ManagementSession(_socket, cls._socket_buffer_size)
        except socket.timeout as e:
            raise ManagementToolError('socket timeout', str(e))
        except (socket.herror, socket.gaierror) as e:
            raise ManagementToolError('socket address error', str(e))
        except socket.error as e:
            raise ManagementToolError('socket error', str(e))
