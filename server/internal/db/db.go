package db

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func (s *DBserver) PutIntoUsersTable(username string) error {
	user := bson.M{
		"_id":       username, // PK
		"createdAt": time.Now().UTC(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := s.Userscoll.InsertOne(ctx, user)
	if err != nil {
		// Duplicate key error
		if mongo.IsDuplicateKeyError(err) {
			return errors.New("user already exists")
		}
		return err
	}

	return nil

}

func (s *DBserver) PutIntoPassTable(username string, hashedPass *HashedPass) error {
	pass := bson.M{
		"_id":    username,
		"Hashed": hashedPass.Hash,
		"Salt":   hashedPass.Salt,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := s.PassColl.InsertOne(ctx, pass)
	return err

}
