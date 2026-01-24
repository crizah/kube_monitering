package db

import (
	"context"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type DBserver struct {
	mongoClient *mongo.Client
	Userscoll   *mongo.Collection
	PassColl    *mongo.Collection
}

func InitialiseDBserver() (*DBserver, error) {
	uri := os.Getenv("MONGODB_URI")
	opts := options.Client().ApplyURI(uri)

	client, err := mongo.Connect(opts)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}
	u := client.Database("Kube-Mon").Collection("Users")
	p := client.Database("Kube-Mon").Collection("Pass")

	return &DBserver{mongoClient: client, Userscoll: u, PassColl: p}, nil

}
