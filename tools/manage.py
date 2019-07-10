import logging
import re
import socket
from typing import List

from error import BasicError

logger = logging.getLogger(__name__)


class ManagementToolError(BasicError):
    pass


class ManagementSession:
    _supported_management_interface_versions = ['1']

    def __init__(self, _socket: socket.socket, buffer_size: int):
        self._socket = _socket
        self._buffer_size = buffer_size

        # use a flag to track if the socket has been closed
        self._is_closed = False

        # receive the welcome info message from the server and check the version
        welcome = self._recv(ignore_realtime_messages=False)
        match = re.search(r'management interface version ([^\s]+)', welcome, re.IGNORECASE)
        if not match or match.group(1) not in self._supported_management_interface_versions:
            self.exit()  # exit first
            raise ManagementToolError('Unsupported management interface version')

    def exit(self):
        if self._is_closed:  # if call exit() after session is closed, simply ignore it
            return
        self._send('exit')
        self._socket.shutdown(socket.SHUT_RDWR)
        self._socket.close()
        self._is_closed = True

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
              ignore_realtime_messages: bool = True) -> str:
        if self._is_closed:
            raise ManagementToolError('session has been closed')
        # if not multilines_termination:
        #     raise ManagementToolError('multilines termination must not be empty')

        ord_newline = ord('\n')  # index of newline character for byte comparison

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
                # Real-time messages start with a '>' character in the first column and are immediately followed by a
                # type keyword
                is_realtime = line[0] == '>' and line[1].isalpha()

                if multilines:
                    if line == multilines_termination:
                        stop_receiving = True
                        # do not keep it
                    else:
                        if not is_realtime or not ignore_realtime_messages:
                            lines.append(line)
                else:
                    if not is_realtime or not ignore_realtime_messages:
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

    def version(self) -> dict:
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

    def status(self):
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
                # realtime defined tables
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

                # merge dual-format time columns into a single column
                merge_time_columns = []
                for k, v in row.items():
                    if k.endswith(time_t_suffix):
                        short_key = k[:-len(time_t_suffix)]
                        if short_key in row:
                            merge_time_columns.append((short_key, k, int(v)))
                for short_key, key, value in merge_time_columns:
                    row[short_key] = value
                    del row[key]

                # convert column names to python style
                row = {k.replace(' ', '_').lower(): v for k, v in row.items()}
                table.append(row)
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
        except (socket.error, socket.herror, socket.gaierror) as e:
            raise ManagementToolError('socket error', str(e))
