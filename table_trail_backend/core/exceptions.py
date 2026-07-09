# Base Exception
class DatabaseSystemError(Exception):
    pass

class ScanningSystemError(Exception):
    pass



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

# Scanning Error
class ScanningError(ScanningSystemError):
    pass



