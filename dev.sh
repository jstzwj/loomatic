cd web/default
npm start


go mod download
go build -ldflags "-s -w" -o one-api
chmod u+x one-api
./one-api --port 3000 --log-dir ./logs