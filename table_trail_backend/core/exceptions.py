# Base Exception
class DatabaseSystemError(Exception):
    pass

class ScanningSystemError(Exception):
    pass



# General Exceptions
class NotAllowedError(DatabaseSystemError):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


# Database Exceptions
class DatabaseError(DatabaseSystemError):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

# Table Exceptions
class TableError(DatabaseSystemError):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

# Column Exceptions
class ColumnError(DatabaseSystemError):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

# Constraint Error
class ConstraintError(DatabaseSystemError):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)



# Scanning Exceptions
class ScannerConnectionError(ScanningSystemError):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ScannerUnsupportedDBError(ScanningSystemError):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class ScannerDataError(ScanningSystemError):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)



