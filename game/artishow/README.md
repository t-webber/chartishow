# Faire tourner le projet

Pour jouer au jeu, il suffit d'une installation récente de Python avec
Flask.

# Chartichaud le jeu


## Règles générales.

Le jeu considéré est un jeu à deux joueurs qui se joue tour par tour
(d'abord le joueur A, puis le joueur B, puis de nouveau le joueur A,
etc.). Chaque joueur a un score, une quantité d'or et des unités.  Le
jeu se déroule sur une grille de dimension $H\times W$, chaque case
pouvant contenir une certaine quantité d'or et un certain nombre (non
limité) d'unités. Il existe trois types d'unités : les civiles, les
militaires et les bâtiments et à chaque tour d'un joueur chacune de
ses unités peut	faire une action. À la fin de chaque tour d'un joueur
si une unité militaire est sur la même case qu'une unité adverse
(militaire ou non) cela déclenche un combat qui va éliminer des
unités.


## Actions.

Les actions possibles d'une unité dépendent du type d'unité :
- la seule action d'une unité militaire est le déplacement à l'une
  des (au plus) 4 cases voisines de celle où elle est ;
- pour une unité civile, les trois actions possibles sont :
  déplacement à l'une des 4 cases voisines, construction d'une unité
  bâtiment et récolte d'or ;
- un bâtiment n'a que deux actions possibles : recruter une
  unité	civile ou militaire.

Si une unité vient d'être produite, elle peut immédiatement jouer. Il
est donc possible de fabriquer un bâtiment avec une unité civile puis
de l'utiliser pour produire une unité militaire qui ensuite se
déplace.



## Combats.

Si à la fin d'un tour d'un des deux joueurs, une case contient des
unités des deux joueurs et au moins une unité militaire alors il y a
un combat. L'issue du combat et le nombre de points obtenus dépendent
de qui est l'attaquant et qui est le défenseur, l'attaquant étant le
joueur qui vient de jouer (et donc s'est déplacé et a déclenché le
combat).

Lors d'un combat, commencent par s'affronter les unités militaires,
notant $m_A$ le nombre d'unités militaire attaquantes et $m_D$ le
nombre d'unités militaires défenseuses. Les défenseuses éliminent
$\lceil m_D/2 \rceil$ unités attaquantes, s'il en reste alors $m_A'$
alors celles-ci éliminent $\lceil m_A' / 2 \rceil$ unités, il reste
alors $m_D'$ défenseuses qui éliminent $\lceil m_D'/2 \rceil$ unités
militaires attaquantes, et cela continue jusqu'à ce que toutes les
unités militaires d'un des deux camps soient éliminées (ce qui peut
être immédiat si un des deux ne disposaient pas d'unités
militaires). Une fois que les unités militaires se sont détruites, le
camp qui n'a plus d'unités militaires perd toutes ses unités civiles
et bâtiments sur la case.


## Scores et coûts des unités.

Construire une unité coûte de l'or : 5 pour une unité civile, 10 pour
une militaire et 15 pour un bâtiment. Il y a deux manières de gagner
des points : en récoltant de l'or ou en attaquant et détruisant des
unités adverses. Chaque unité d'or récoltée rapporte un point et
chaque unité adverse détruite dans un combat où l'on est attaquant
rapporte son coût (une unité civile détruite rapporte 5 points, etc.).
Noter que l'or récolté puis payé pour construire une unité ne retire
pas de point.

## Récolte d'or.

Pour récolter de l'or il faut qu'une unité civile soit une case avec
de l'or et utilise l'action récolter. L'action récolter va alors
diminuer de un la quantité d'or sur la case. Il n'est pas possible,
même en utilisant deux unités civiles, de récolter deux fois l'or
d'une même case. Il est possible, en revanche, que les deux joueurs
aient une unité civile sur une case et récolte chacune à leur tour
l'or.

## Visibilité.

La carte n'est pas entièrement visible, vous ne pouvez voir une case
$(x,y)$ que si vous avez une unité à la case $(x',y')$ avec
$max(|x-x'|,|y-y'|)\leq 2$.

