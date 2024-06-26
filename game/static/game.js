function nextTurn() {
  curPlayer = '' ;
  $.ajax({
      url: '/endturn/'+player+'/'+token,
      complete: function(data){redraw();}
  });
}

function autofarm() {
  curPlayer = '' ;
  $.ajax({
      url: '/autofarm/'+player+'/'+token,
      complete: function(data){redraw();}
  });
}

function moveUnit(id) {
  if(selected_unit != "") {
      document.getElementById(selected_unit).className =
          document.getElementById(selected_unit).className.replace(" selected","");
      selected_unit = "";
  } else {
    document.getElementById(id).className += " selected";
    selected_unit = id ;  
  }
}

function moveToCell(ty,tx) {
  if(selected_unit != "" && unit_type[selected_unit] != 'B') {
    [fy,fx] = position[selected_unit] ;
      if(Math.abs(fx-tx) + Math.abs(fy-ty) == 1) {
        $.ajax({
          url: '/move/'+player+'/'+unit_type[selected_unit]+'/'+fy+'/'+fx+'/'+ty+'/'+tx+'/'+token,
          complete: function(d){redraw();}
        });
        if(SKIP>0){SKIP--;} //Ligne moddée
        SHIFT=1 //Ligne moddée
      }
  }
}

function farm() {
  if( selected_unit != "" && unit_type[selected_unit] == 'C') { 
    [fy,fx] = position[selected_unit] ;
    $.ajax({
      url: '/farm/'+player+'/'+fy+'/'+fx+'/'+token,
      complete: function(d){redraw();}
    });      
  }
}

function build() {
  if( selected_unit != "" && unit_type[selected_unit] == 'C') { 
    [fy,fx] = position[selected_unit] ;
    $.ajax({
      url: '/build/'+player+'/'+fy+'/'+fx+'/B'+'/'+token,
      complete: function(d){redraw();}
    });      
  }
}

function recruit_unit(t) {
  if( selected_unit != "") { 
    [fy,fx] = position[selected_unit] ;
    $.ajax({
      url: '/build/'+player+'/'+fy+'/'+fx+'/'+t+'/'+token,
      complete: function(d){redraw();}
    });      
  }
}


function addUnit(cell, name, nb,movable,y,x, kind) {
  if(nb>0) {
    var unit = document.createElement('div');
    id = "unit"+id_unit;
    unit.setAttribute("id", id);
    unit.className = name;
    unit.innerHTML = "<img src='"+name.split(" ")[0]+".png' />";
    if (nb > 1) { 
      unit.innerHTML += "<span>"+nb+"</span>" ;
    }
    cell.append(unit);
    position[id] = [y,x];
    unit_type[id] = kind ;  
    if(player == curPlayer && movable) {
        unit.setAttribute("onclick", "moveUnit(this.id)");
    } else {
        unit.className += " fixed";
    }
    id_unit ++ ;
  }
}

function drawWithData(data) {
  curPlayer = data["player"] ;
  curMap = data["map"] ;
  curGold = data["gold"] ;
  height = data["height"] ;
    width = data["width"] ;
  var cpdiv = document.getElementById('gold');
  if(player != "all") {
    cpdiv.innerHTML = "<h1>"+curGold[player]+"</h1>";
  } else {
      cpdiv.innerHTML = "A: "+curGold["A"]+" | B: "+curGold["B"];
  }
  var scdiv = document.getElementById('score');
  scdiv.innerHTML = 'A:' + data["score"]['A'] + '<br /> B: '+data["score"]['B'] ;
  document.getElementById('nextTurn').disabled = (player != curPlayer) ;
  selected_unit = "" ;
  position = [] ;
  unit_type = [] ;
  document.getElementById('board').innerHTML = "" ;  
  for (var y = 0; y < height ; y++) {
     for(var x = 0; x < width ; x++){
       var cell = document.createElement('div');
       cell.style.position = 'absolute' ;
       cell.style.top = (y*(size_cells+1)+75)+'px' ;
       cell.style.left = (x*(size_cells+1))+'px' ;
       cell.setAttribute('id',y+"-"+x) //Ligne moddée
       cell.setAttribute("onclick","moveToCell("+y+","+x+");");  
       cellData = data["map"][y][x] ;
       if(cellData.hasOwnProperty('G')) {
           cell.className = 'cell';
           if(data.hasOwnProperty("viewA")) {
               if(data["viewA"].hasOwnProperty(y+"_"+x)) {
                 if(data["viewB"].hasOwnProperty(y+"_"+x)) {
                     cell.className += ' vc';
                 } else {
                     cell.className += ' va';
                 }
               } else {
                 if(data["viewB"].hasOwnProperty(y+"_"+x)) {
                     cell.className += ' vb';
                 }
               }
           }
           addUnit(cell,'ab building player_a',cellData['A']['B'],cellData['A'].hasOwnProperty('Bm'),y,x,'B');
           addUnit(cell,'am unit mili player_a',cellData['A']['M'],cellData['A'].hasOwnProperty('Mm'),y,x,'M');
           addUnit(cell,'ac unit civil player_a',cellData['A']['C'],cellData['A'].hasOwnProperty('Cm'),y,x,'C');           
           addUnit(cell,'bb building player_b',cellData['B']['B'],cellData['B'].hasOwnProperty('Bm'),y,x,'B');
           addUnit(cell,'bm unit mili player_b',cellData['B']['M'],cellData['B'].hasOwnProperty('Mm'),y,x,'M');
           addUnit(cell,'bc unit civil player_b',cellData['B']['C'],cellData['B'].hasOwnProperty('Cm'),y,x,'C');
         if(cellData['G']>0) { 
           var gold = document.createElement('div');
           gold.className = 'gold';
           gold.innerHTML = "<p>"+cellData['G']+"</p>";
           cell.appendChild(gold);
         }
       } else {
          cell.className = 'cell hidden';
        }
      document.getElementById("board").appendChild(cell);
    }
  }
  if(data.hasOwnProperty("winner") && data["winner"] != "") {
      if(!document.getElementById("winnerTitle")) {
        var winnerTitle = document.createElement('div');
        winnerTitle.className = 'winner' ;
        winnerTitle.id = 'winnerTitle' ;
        winnerTitle.innerHTML = '<p>The winner is player '+data['winner']+'!</p>'
        document.body.appendChild(winnerTitle);
     }  
  } else {
      if(document.getElementById("winnerTitle")) {
          document.getElementById("winnerTitle").remove()
      }
  }
    
}

function redraw() {
  $.ajax({
      url: '/view/'+player+'/'+token,
      success: function(data){drawWithData(data);}
  });  
  if(player != curPlayer) {
      setTimeout( () => {redraw() ;}, "100") ;
  }
}

function init() {
  player = 'all';
  curPlayer = 'C' ;  
  id_unit = 0 ;
  size_cells = 100;
  if(confirm("Register as a player?")) {
    $.ajax({
      url: '/getToken',
        success: function(d){player=d['player']; token = d['token'];redraw();}
    });      
  } else {
      token='nop'
      redraw();
  }
}





init();

//Début du contenu moddé (+ 3 lignes plus haut)

function scan(id,joueur){
  var nodeText = $('#'+id).contents();
  nodeText.filter(function() { //On analyse les enfants de la case id
    return this.nodeType === 1;
  });
  T=Object.keys(nodeText).length-2
  if (T>=0){ //On vérifie qu'on a autre chose que rien sur la case
    S=0
    T=false
    while (T==false){// On checke les différents éléments de la case
      try{A=nodeText[S].className.split(" ");}
      catch(error){console.log("erreur de def");return("False")}
      if (nodeText[S].className=="gold"){console.log("gold error");return("False")} //On vérifie qu'on sort pas et que ce n'est pas de l'or
      const substr = 'player_'+joueur;
      const substr2= 'fixed';
      const subArr = A.some(str => str.includes(substr));
      const subArr2 = A.some(str => str.includes(substr2));
      if (subArr && !subArr2){T=true;} //Si l'entité est non fixé et appartient au bon joueur on peut la sélectionner
      else {S++;}
    }
    return(nodeText[S].id);//Alors on renvoie son identifiant
    } 
  return("False")
        }

SKIP=0

function NextPawn(){
  TEST=0
  joueur=player.toLowerCase(); //Récupère le joueur actif
  K=-1
  for (let index = 0; index < 9; index++) {
    for (let index2 = 0; index2 < 16; index2++) {
      ID=index.toString()+"-"+index2.toString(); //On traduit les index en id moddée de chaque case
      D=scan(ID,joueur) //On cherche ensuite la présence d'unité sélectionnables sur la case
      if (D!="False"){ //Permet de sauter SKIP unités avant de sélectionner la bonne
        console.log(D)
        K++
        if (K==SKIP){
          if (selected_unit!=""){moveUnit(D);} //Permet de déselectionner si une unité est déjà sélectionnée
          moveUnit(D);
          TEST=1; //Vérifie qu'on a au moins sélectionné une unité, sinon il faut reset SKIP (on suppose qu'il y a au moins une unité en vie)
          SKIP=SKIP+1;
          return("LOL");}
      }
    }
  }
  if (TEST==0 && K>0){ //Permet de gérer les overflow de SKIP
    SKIP=0;
    NextPawn();}
;
}

SHIFT=1
function ShiftEntity(){
  parentDiv = document.getElementById(selected_unit).parentNode; //On obtient la case de l'unité
  R=parentDiv.children //Ses enfants
  try {
    R[SHIFT].className=="gold";//Vérfie si on est pas en overflow et reset alors SHIFT
  } catch (error) {
    SHIFT=0;
  }
  if (R[SHIFT].className=="gold"){SHIFT=0;} //Si on est arrivé sur du gold on reset
  T=R[SHIFT].id //On prend du coup la bonne nouvelle unité (l'ordre est toujours Château, Chevalier, Péon, Or)
  moveUnit(T)// Et on la sélectionne (x2 car le premier déselectionne)
  moveUnit(T)
  SHIFT++ //Et on augmente SHIFT
}

function MovePawn(Direction){ //Fait le mouvement des unités sélectionnées
  [fy,fx] = position[selected_unit]
  if (Direction=="Up"){moveToCell(fy-1,fx); return("Done")}
  if (Direction=="Down"){moveToCell(fy+1,fx); return("Done")}
  if (Direction=="Left"){moveToCell(fy,fx-1); return("Done")}
  if (Direction=="Right"){moveToCell(fy,fx+1); return("Done")}
}

document.addEventListener("keydown",e=>{ //Toutes les keybinds
    if (e.key==" "){NextPawn(); return("Done")}
    if (e.key=="ArrowUp"){MovePawn("Up"); return("Done")}
    if (e.key=="ArrowDown"){MovePawn("Down"); return("Done")}
    if (e.key=="ArrowLeft"){MovePawn("Left"); return("Done")}
    if (e.key=="ArrowRight"){MovePawn("Right"); return("Done")}
    if (e.key.toLowerCase()=="g"){autofarm(); return("Done")}
    if (e.key=="Enter"){nextTurn(); return("Done")}
    if (e.key.toLowerCase()=="a"){farm(); return("Done")}
    if (e.key.toLowerCase()=="e"){recruit_unit('C'); return("Done")}
    if (e.key.toLowerCase()=="q"){recruit_unit('M'); return("Done")}
    if (e.key.toLowerCase()=="d"){build(); return("Done")}
    if (e.key.toLowerCase()=="c"){ShiftEntity(); return("Done")}
    
})

console.log(scan("0-0","a"))

//Fin du contenu moddé
