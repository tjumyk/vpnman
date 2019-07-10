from unittest import TestCase

from flask import json

from tools.manage import ManagementTool, ManagementSession


def dump(data):
    return json.dumps(data, indent=2, sort_keys=False)


class TestManagementTool(TestCase):
    session: ManagementSession

    @classmethod
    def setUpClass(cls) -> None:
        cls.session = ManagementTool.connect()

    @classmethod
    def tearDownClass(cls) -> None:
        if cls.session:
            cls.session.exit()

    def test_version(self):
        print(dump(self.session.version()))

    def test_state(self):
        print('=== state ===')
        print(self.session.state())

        print('=== state 3 ===')
        for state in self.session.state(3):
            print(state)

        print('=== state all ===')
        for state in self.session.state('all'):
            print(state)

    def test_status(self):
        print(dump(self.session.status()))

    def test_load_stats(self):
        print(dump(self.session.load_stats()))

    def test_log(self):
        print('=== log 5 ===')
        for log in self.session.log(5):
            print(log)

        print('=== log all ===')
        for log in self.session.log('all'):
            print(log)
