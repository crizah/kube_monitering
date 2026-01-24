package db

import (
	"crypto/rand"
	"encoding/base64"
	"errors"

	"io"

	"golang.org/x/crypto/argon2"
)

const (
	SALT_BYTES = 16
	HASH_BYTES = 32
	TIME       = 3
	MEMORY     = 64 * 1024
	THREADS    = 4
)

type HashedPass struct {
	Hash string
	Salt string
}

func HashPassword(password string) (*HashedPass, error) {
	salt := make([]byte, SALT_BYTES)

	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return nil, errors.New("err generating random salt")

	}

	// generate hash with argon2

	key := argon2.IDKey([]byte(password), salt, TIME, MEMORY, THREADS, HASH_BYTES)

	// return salt and hash
	return &HashedPass{Hash: base64.RawStdEncoding.EncodeToString(key), Salt: base64.RawStdEncoding.EncodeToString(salt)}, nil
}

func VerifyPassword(username string, password string) (*HashedPass, error) {
	hashedPass, err := HashPassword(password)
	return hashedPass, err

}
