"""Game server."""

import os
import sys
from math import ceil
from flask import Flask, jsonify
import random
from collections import defaultdict
import string

import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)


dirs = [(1, 0), (0, 1), (-1, 0), (0, -1)]
players = []

app = Flask(__name__, static_url_path='', static_folder='static')

# ####  AUTH PARAMETERS #### #

tokenOf = {}

# ####  GAME PARAMETERS #### #

MAX_NB_ROUNDS = 2000
MAP_WIDTH = 16
MAP_HEIGHT = 9
NB_GOLD_SPOTS = 15

# defines an empty map
farmed = set()
mapdata = []
for y in range(MAP_HEIGHT):
    mapdata.append([])
    for x in range(MAP_WIDTH):
        mapdata[-1].append({'G': 0, 'A': {'C': 0, 'M': 0,
                           'B': 0}, 'B': {'C': 0, 'M': 0, 'B': 0}})
nbMoves = defaultdict(int)

# set the initial gold reserves
for i in range(NB_GOLD_SPOTS):
    x = random.randint(0, MAP_WIDTH - 1)
    y = random.randint(0, MAP_HEIGHT - 1)
    n = random.randint(1, 12)
    mapdata[y][x]['G'] += n * n
    mapdata[MAP_HEIGHT - 1 - y][MAP_WIDTH - 1 - x]['G'] += n * n

price = {'C': 5, 'M': 10, 'B': 15}  # the price of each unit
PAWN = 'C'
KNIGHT = 'M'
CASTLE = 'B'
requires = {'C': 'B', 'M': 'B', 'B': 'C'}  # what do we need to build
winner = ''
curPlayer = 'A'  # initial player
gold = {'A': 25, 'B': 25}  # initial gold


mapdata[0][0]['A']['C'] = 3  # initial units of A
mapdata[-1][-1]['B']['C'] = 3  # initial units of B
opponent = {'A': 'B', 'B': 'A'}


# ### END GAME PARAMETER ### #
score = {'A': 0, 'B': 0}
nbRounds = 0


@app.route('/getToken')
def getToken():
    if len(tokenOf) < 2:
        rt = "".join(random.choices(string.ascii_uppercase +
                     string.ascii_lowercase + string.digits, k=8))
        if 'A' in tokenOf:
            player = 'B'
        else:
            player = 'A'
        tokenOf[player] = rt
    return jsonify({'player': player, 'token': rt})


def getVisibility(player):
    visible = set()
    for y in range(0, MAP_HEIGHT):
        for x in range(0, MAP_WIDTH):
            if mapdata[y][x][player]['C'] + mapdata[y][x][player]['M'] + mapdata[y][x][player]['B'] > 0:
                for dx in range(-2, 3):
                    for dy in range(-2, 3):
                        visible.add((y + dy, x + dx))
    return visible


def giveAllView():

    global winner
    data = {'map': mapdata,
            'gold': gold,
            'player': curPlayer,
            'height': MAP_HEIGHT,
            'width': MAP_WIDTH,
            'score': score,
            'viewA': {str(y) + "_" + str(x): 1 for (y, x) in getVisibility('A')},
            'viewB': {str(y) + "_" + str(x): 1 for (y, x) in getVisibility('B')},
            'winner': winner}
    return jsonify(data)


@app.route('/view/<player>/<token>')
def giveView(player, token):

    global winner
    if player == "all" or winner != "":
        return giveAllView()
    assert (tokenOf[player] == token)
    mapView = [[{} for x in range(MAP_WIDTH)] for y in range(MAP_HEIGHT)]
    visible = getVisibility(player)
    if len(visible) == 0:
        winner = opponent[player]
        log()
    for y in range(0, MAP_HEIGHT):
        for x in range(0, MAP_WIDTH):
            if (y, x) in visible:
                mapView[y][x] = mapdata[y][x]
                for k in ['C', 'M', 'B']:
                    if k + "m" in mapView[y][x][curPlayer]:
                        mapView[y][x][curPlayer].pop(k + "m")
                    if nbMoves[(y, x, curPlayer, k)] < mapView[y][x][curPlayer][k]:
                        mapView[y][x][curPlayer][k + "m"] = True

    data = {'map': mapView,
            'gold': {player: gold[player]},
            'player': curPlayer,
            'height': MAP_HEIGHT,
            'width': MAP_WIDTH,
            'score': score,
            'winner': winner}
    return jsonify(data)


@app.route('/move/<player>/<kind>/<int:y>/<int:x>/<int:ny>/<int:nx>/<token>')
def move(player, kind, y, x, ny, nx, token):
    global nbMoves
    assert (tokenOf[player] == token)
    assert (abs(x - nx) + abs(y - ny) == 1)
    assert (0 <= nx < MAP_WIDTH and 0 <= ny < MAP_HEIGHT)
    assert (0 <= x < MAP_WIDTH and 0 <= y < MAP_HEIGHT)
    assert (mapdata[y][x][player][kind] > 0)  # useless because of next line ?
    assert (nbMoves[(y, x, player, kind)] < mapdata[y][x][player][kind])
    nbMoves[(ny, nx, player, kind)] += 1
    mapdata[y][x][player][kind] -= 1
    mapdata[ny][nx][player][kind] += 1
    return "ok"


@app.route('/build/<player>/<int:y>/<int:x>/<kind>/<token>')
def build(player, y, x, kind, token):
    assert (tokenOf[player] == token)
    assert (0 <= x < MAP_WIDTH and 0 <= y < MAP_HEIGHT)
    assert (kind in price)
    assert (mapdata[y][x][opponent[player]]['B'] == 0)
    assert (mapdata[y][x][player][requires[kind]] > 0)
    assert (nbMoves[(y, x, player, requires[kind])] < mapdata[y][x][player][requires[kind]])
    assert (gold[player] >= price[kind])
    nbMoves[(y, x, player, requires[kind])] += 1
    nbMoves[(y, x, player, kind)] += 1
    mapdata[y][x][player][kind] += 1
    gold[player] -= price[kind]
    return "ok"


@app.route('/farm/<player>/<int:y>/<int:x>/<token>')
def farm(player, y, x, token):
    assert (tokenOf[player] == token)
    assert (0 <= x < MAP_WIDTH and 0 <= y < MAP_HEIGHT)
    assert (nbMoves[(y, x, player, 'C')] < mapdata[y][x][player]['C'])
    assert (mapdata[y][x]['G'] > 0)
    assert ((y, x) not in farmed)
    nbMoves[(y, x, player, 'C')] += 1
    mapdata[y][x]['G'] -= 1
    farmed.add((y, x))
    gold[player] += 1
    score[player] += 1
    return "ok"


def battle(y, x, k, attacker, defender):
    na = mapdata[y][x][attacker][k]
    nb = mapdata[y][x][defender][k]
    while na > 0 and nb > 0:
        na -= ceil(nb / 2)
        nb -= ceil(na / 2)
    mapdata[y][x][attacker][k] = na
    mapdata[y][x][defender][k] = nb


def solveBattles(attacker, defender):  # combat rules
    global score
    for y in range(0, MAP_HEIGHT):
        for x in range(0, MAP_WIDTH):
            nbDefenderUnitsBefore = mapdata[y][x][defender]['B'] * price['B'] + \
                mapdata[y][x][defender]['M'] * price['M'] + \
                mapdata[y][x][defender]['C'] * price['C']
            # solve the case of Military vs Military
            for k in ['M']:  # we could do C vs C by adding 'C' here
                battle(y, x, k, attacker, defender)
            for (p, o) in [('A', 'B'), ('B', 'A')]:
                # solve the case of Military vs Civil
                if mapdata[y][x][p]['M'] > 0:
                    mapdata[y][x][o]['C'] = 0
                # solve the case of remaining Military vs Building
                if mapdata[y][x][p]['M'] > 0:
                    mapdata[y][x][o]['B'] = 0
                # we cannot have multiple buildings for a given player
                # and we cannot have buildings for two different players
                # as recruiting requires no building
                mapdata[y][x][p]['B'] = min(mapdata[y][x][p]['B'], 1)
            nbDefenderUnitsAfter = mapdata[y][x][defender]['B'] * price['B'] + \
                mapdata[y][x][defender]['M'] * price['M'] + \
                mapdata[y][x][defender]['C'] * price['C']
            score[attacker] += nbDefenderUnitsBefore - nbDefenderUnitsAfter


@app.route('/autofarm/<player>/<token>')
def autofarm(player, token):
    assert (tokenOf[player] == token)
    for y in range(MAP_HEIGHT):
        for x in range(MAP_WIDTH):
            try:
                farm(player, y, x, token)
            except:
                pass
    return "ok"


@app.route('/endturn/<player>/<token>')
def changeturn(player, token):
    global nbRounds
    global curPlayer
    global nbMoves
    global farmed
    global winner
    global tokenOf
    assert (tokenOf[player] == token)
    assert (player == curPlayer)
    solveBattles(player, opponent[player])
    curPlayer = opponent[player]
    nbMoves = defaultdict(int)
    farmed = set()
    nbRounds += 1
    if winner == '' and nbRounds >= MAX_NB_ROUNDS:
        if score['A'] < score['B']:
            winner = 'B'
        elif score['A'] > score['B']:
            winner = 'A'
        else:
            winner = 'No one'
    if winner != "":
        tokenOf = defaultdict(lambda x: "")
    log()
    return "ok"


def log():
    if len(sys.argv) > 2:
        if winner:
            s = f"{nbRounds},{score}\nWINNER = {winner}\nNotes = '{sys.argv[3]}'\n"
            with open(sys.argv[2], 'a') as f:
                f.write(s)
            print(s)
            os._exit(0)
        elif nbRounds % 100 == 0:
            with open(sys.argv[2], 'a') as f:
                f.write(f"{nbRounds},{score}\n")


@app.route('/')
def root():
    return app.send_static_file('index.html')


if len(sys.argv) > 1:
    PORT = int(sys.argv[1])
else:
    PORT = 8080
print(f" http://localhost:{PORT}/ ")
app.run(host='0.0.0.0', port=PORT, debug=True)
