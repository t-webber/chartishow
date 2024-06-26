i=0
offset=0
while [[ $i -lt 2 ]] ; do
    port=$(($i + $1))
    echo "python3 game/server.py $port $2$3$i.csv \"\'Note\'\" &"
    bash -c "python3 game/server.py $port $2$3$i.csv \"\'Note\'\" &"
    sleep 2
    bash -c "python3 $2/src/main.py 1  http://localhost:$port &"
    sleep 2
    bash -c "python3 $3/src/main.py 1  http://localhost:$port &"
    sleep 2
    ((i++))
done