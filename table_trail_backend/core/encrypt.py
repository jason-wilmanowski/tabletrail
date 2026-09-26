import base64
import binascii
import os
from functools import lru_cache

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from table_trail_backend.core.config import settings
from table_trail_backend.core.exceptions import EncryptionError, EncryptionKeyError

NONCE_SIZE = 12


@lru_cache
def _get_cipher() -> AESGCM:
    if not settings.ENCRYPTION_KEY:
        raise EncryptionKeyError("ENCRYPTION_KEY is not set", 500)
    try:
        key = base64.urlsafe_b64decode(settings.ENCRYPTION_KEY)
    except (binascii.Error, ValueError) as error:
        raise EncryptionKeyError("ENCRYPTION_KEY is not valid base64", 500) from error
    if len(key) != 32:
        raise EncryptionKeyError("ENCRYPTION_KEY must decode to 32 bytes (AES-256)", 500)
    return AESGCM(key)


def encrypt(value: str) -> str:
    nonce = os.urandom(NONCE_SIZE)
    ciphertext = _get_cipher().encrypt(nonce, value.encode(), None)
    return base64.urlsafe_b64encode(nonce + ciphertext).decode()


def decrypt(token: str) -> str:
    cipher = _get_cipher()
    try:
        data = base64.urlsafe_b64decode(token)
        plaintext = cipher.decrypt(data[:NONCE_SIZE], data[NONCE_SIZE:], None)
    except (binascii.Error, ValueError, InvalidTag) as error:
        raise EncryptionError("Stored value could not be decrypted", 500) from error
    return plaintext.decode()
