# Base Database Exception
class DatabaseSystemError(Exception):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


# General Exceptions
class NotAllowedError(DatabaseSystemError):
    pass


# Database Exceptions
class DatabaseError(DatabaseSystemError):
    pass


# Table Exceptions
class TableError(DatabaseSystemError):
    pass


# Column Exceptions
class ColumnError(DatabaseSystemError):
    pass


# Constraint Error
class ConstraintError(DatabaseSystemError):
    pass


# Base Scanning Exception
class ScanningSystemError(Exception):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


# Scanning Exceptions
class ScannerConnectionError(ScanningSystemError):
    pass


class ScannerUnsupportedDBError(ScanningSystemError):
    pass


class ScannerDataError(ScanningSystemError):
    pass


# Base Export Exception
class ExportSystemError(Exception):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


# Export Errors


class ExportTypeUnsupportedError(ExportSystemError):
    pass


class ExportRuntimeError(ExportSystemError):
    pass


class ExportHtmlError(ExportSystemError):
    pass


class ExportPdfError(ExportSystemError):
    pass


class ExportMarkdownError(ExportSystemError):
    pass
