class BasicError(Exception):
    def __init__(self, msg: str, detail=None):
        super().__init__("%s: %s" % (msg, detail))
        self.msg = msg
        self.detail = detail
