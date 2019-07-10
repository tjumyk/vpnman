from unittest import TestCase

from flask import json

from tools.manage import ManagementTool, ManagementSession


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
        print(self.session.version())

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
        print(json.dumps(self.session.status(), indent=2))
