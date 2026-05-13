/*
Fecha de entrega: 12 mayo 2025, 11:59 pm
Desarrollar un agente que juegue cuadrito. Tiene límite de tiempo:
 1. Aquí encuentran el código del ambiente
 2. Su agente debe heredar de la clase Agent y debe sobreescribir el método compute
 3. El método de iniciar el agente recibe tres argumentos: 
    - El color con que está jugando
    - El tablero inicial del cual puede obtener el tamaño (siempre cuadrado)
    - El tiempo total de juego en milisegundos
 4. El método compute recibe dos argumentos:
    - El tablero como va 
    - El tiempo que le queda a su agente en milisegundos
 5. El método compute debe retornar una lista con tres argumentos [fila, columna, lado]. El valor del lado
 es un número 0: arriba, 1: derecha, 2.abajo, 3:izquierda 
*/

/**
 * Abstract agent class
 */
class Agent{
    /**
     * Creates an agent
     */
    constructor(){}
    
    /**
     * Initializes the agent
     * @param color Color of the agent pieces ('R':red or 'Y':yellow)
     * @param board Initial state of the board (empty, useful for obtaaining the size (nxn))
     * @param time Total amount of time the agent has for playing all the game (milliseconds)
     */
    init(color, board, time=20000){
        this.color = color
        this.time = time
        this.size = board.length
    }

    /**
     * Determines the next play of the agent
     * @param board Current square configuration
     * @param time Remaining time the agent has for playing all the game (milliseconds)
     * @return A list with three values [row, column, side]. Parameter size can take one of the following values: 
               0 is up, 1 is right, 2 is bottom, 3 is left  
     */
    compute( board, time ){ return [0,0,0]; }
}

/*
 * A class for board operations (it is not the board but a set of operations over it)
 */
class Board{
    constructor(){}

    // Initializes a board of the given size. A board is a matrix of size*size of integers 0, .., 15, -1, or -2
    init(size){
    	var m = size-1
        var board = []
        board[0] = []
        board[0][0] = 9
        for(var j=1; j<m; j++){
	    board[0][j] = 1
	}
	board[0][m] = 3
	
        for(var i=1; i<m; i++){
            board[i] = []
            board[i][0] = 8
            for(var j=1; j<m; j++){
		board[i][j] = 0
	    }
	    board[i][m] = 2
        }
        
        board[m] = []
        board[m][0] = 12
        for(var j=1; j<m; j++){
	    board[m][j] = 4
	}
	board[m][m] = 6

        return board
    }

    // Deep clone of a board the reduce risk of damaging the real board
    clone(board){
        var size = board.length
        var b = []
        for(var i=0; i<size; i++){
            b[i] = []
            for(var j=0; j<size; j++)
                b[i][j] = board[i][j]
        }
        return b
    }

    // Determines if a line can be drawn at row r, column c, side s 
    check(board, r, c, s){
        if(board[r][c] < 0) return false
        s = 1<<s
        return ((board[r][c] & s)!=s)
    }

    // Computes all the valid moves for the given 'color'
    valid_moves(board){
        var moves = []
        var size = board.length
        for( var i=0; i<size; i++)
            for( var j=0; j<size; j++)
                for( var s=0; s<4; s++)
                    if(this.check(board, i, j, s)) moves.push([i,j,s])
        return moves
    }
    
    fill(board, i, j, color){
        if(i<0 || i==board.length || j<0 || j==board.length) return board
    	
        if(board[i][j]==15 || board[i][j] == 14){
            board[i][j] = color
            if(i>0 && board[i-1][j]>=0){
                board[i-1][j] += 4
                this.fill(board,i-1,j,color)
            }    
        }
        
        if(board[i][j]==15 || board[i][j] == 13){
            board[i][j] = color
            if(j<board.length-1 && board[i][j+1]>=0){
                board[i][j+1] += 8
                this.fill(board,i,j+1,color)
            }    
        }
        
        if(board[i][j]==15 || board[i][j]==11){
            board[i][j] = color
            if(i<board.length-1 && board[i+1][j]>=0){
                board[i+1][j] += 1
                this.fill(board,i+1,j,color)
            }    
        }
        
        if(board[i][j]==15 || board[i][j]==7){
            board[i][j] = color
            if(j>0 && board[i][j-1]>=0){
                board[i][j-1] += 2
                this.fill(board,i,j-1,color)
            }    
        }
        return board
    }

    // Computes the new board when a piece of 'color' is set at row i, column j, side s. 
    // If it is an invalid movement stops the game and declares the other 'color' as winner
    move(board, i, j, s, color){
    	if(this.check(board, i, j, s)){
    	    var ocolor = (color==-2)?-1:-2
    	    board[i][j] |= 1<<s
    	    board = this.fill(board, i, j, ocolor)
    	    if(i>0 && s==0){
      	        board[i-1][j] |= 4
    	        board = this.fill(board, i-1, j, ocolor)
    	    }
    	    if(i<board.length-1 && s==2){
      	        board[i+1][j] |= 1
    	        board = this.fill(board, i+1, j, ocolor)
    	    }
    	    if(j>0 && s==3){
      	        board[i][j-1] |= 2
    	        board = this.fill(board, i, j-1, ocolor)
    	    }
    	    
    	    if(j<board.length-1 && s==1){
      	        board[i][j+1] |= 8
    	        board = this.fill(board, i, j+1, ocolor)
    	    }
    	    return true 
    	}
    	return false
    }

    // Determines the winner of the game if available 'R': red, 'Y': yellow, ' ': none
    winner(board){
    	var cr = 0
    	var cy = 0
    	for(var i=0; i<board.length; i++)
    	  for(var j=0; j<board.length; j++)
    	  if(board[i][j]<0){
    	      if(board[i][j] == -1){ cr++ }else{ cy++ }
    	  }
    	if(cr+cy<board.length*board.length) return ' '
    	if(cr>cy) return 'R'
    	if(cy>cr) return 'Y'
        return ' '
    }

    // Draw the board on the canvas
    print(board){
        var size = board.length
        // Commands to be run (left as string to show them into the editor)
        var grid = []
        for(var i=0; i<size; i++){
            for(var j=0; j<size; j++){
                var commands = [{"command":"-"}]
                if(board[i][j] < 0){
                    if(board[i][j]==-1) commands.push({"command":"R"})
                    else commands.push({"command":"Y"})
                    commands.push({"command":"u"})
                    commands.push({"command":"r"})
                    commands.push({"command":"d"})
                    commands.push({"command":"l"})
                }else{
                    if((board[i][j]&1)==1) commands.push({"command":"u"})
                    if((board[i][j]&2)==2) commands.push({"command":"r"})
                    if((board[i][j]&4)==4) commands.push({"command":"d"})
                    if((board[i][j]&8)==8) commands.push({"command":"l"})
                }
                grid.push({"command":"translate", "y":i, "x":j, "commands":commands})
            }
        }

	var cmds = {"r":true,"x":1.0/size,"y":1.0/size,"command":"fit", "commands":grid}
        Konekti.client['canvas'].setText(cmds)
    }
}

/*
 * Player's Code (Must inherit from Agent: It is mandatory the inheritance process) 
 * This is an example of a rangom player agent
 *
 */
class RandomPlayer extends Agent{
    constructor(){ 
        super() 
        this.board = new Board()
    }

    compute(board, time){
        // Always cheks the current board status since opponent move can change several squares in the board
        var moves = this.board.valid_moves(board)
        // Randomly picks one available move
        var index = Math.floor(moves.length * Math.random())
        for(var i=0; i<50000000; i++){} // Making it very slow to test time restriction
        for(var i=0; i<50000000; i++){} // Making it very slow to test time restriction
        return moves[index]
    }
}

/*
 * Environment (Cannot be modified or any of its attributes accesed directly)
 */
class Environment extends MainClient{
	constructor(){ 
        super()
        this.board = new Board()
    }

    setPlayers(players){ this.players = players }

	// Initializes the game 
	init(){ 
        var white = Konekti.vc('R').value // Name of competitor with red pieces
        console.log(white)
        var black = Konekti.vc('Y').value // Name of competitor with yellow pieces
        var time = 1000*parseInt(Konekti.vc('time').value) // Maximum playing time assigned to a competitor (milliseconds)
        var size = parseInt(Konekti.vc('size').value) // Size of the reversi board
        
        this.size = size
        this.rb = this.board.init(size)
        this.board.print(this.rb)
        var b1 = this.board.clone(this.rb)
        var b2 = this.board.clone(this.rb)

        this.white = white
        this.black = black
        this.ptime = {'R':time, 'Y':time}
        Konekti.vc('R_time').innerHTML = ''+time
        Konekti.vc('Y_time').innerHTML = ''+time
        this.player = 'R'
        this.winner = ''

        this.players[white].init('R', b1, time)
        this.players[black].init('Y', b2, time)
    }

    // Listen to play button 
	play(){ 
        var TIME = 10
        var x = this
        var board = x.board
        x.player = 'R'
        Konekti.vc('log').innerHTML = 'The winner is...'

        x.init()
        var start = -1

        function clock(){
            if(x.winner!='') return
            if(start==-1) setTimeout(clock,TIME)
            else{
                var end = Date.now()
                var ellapsed = end - start
                var remaining = x.ptime[x.player] - ellapsed
                Konekti.vc(x.player+'_time').innerHTML = remaining
                Konekti.vc((x.player=='R'?'Y':'R')+'_time').innerHTML = x.ptime[x.player=='R'?'Y':'R']
                
                if(remaining <= 0) x.winner = (x.player=='R'?x.black:x.white) + ' since ' + (x.player=='R'?x.white:x.black) + 'got time out'
                else setTimeout(clock,TIME) 
            }
        }
        
        function compute(){
            var w = x.player=='R'
            var id = w?x.white:x.black
            var nid = w?x.black:x.white
            var b = board.clone(x.rb)
            start = Date.now()
            var action = x.players[id].compute(b, x.ptime[x.player])
            var end = Date.now()
            var ply = (x.player=='R')?-1:-2
            var flag = board.move(x.rb, action[0], action[1], action[2], ply)
            if(!flag){
                x.winner = nid + ' ...Invalid move taken by ' + id + ' on column ' + action
            }else{
                var winner = board.winner(x.rb)
                if(winner!= ' ') x.winner = winner
                else{
                    var ellapsed = end - start
                    x.ptime[x.player] -= ellapsed
                    Konekti.vc(x.player+'_time').innerHTML = ''+x.ptime[x.player]
                    if(x.ptime[x.player] <= 0){ 
                        x.winner = nid + ' since ' + id + ' got run of time'
                    }else{
                        x.player = w?'Y':'R'
                    }
                }    
            }

            board.print(x.rb)
            start = -1
            if(x.winner=='') setTimeout(compute,TIME)
            else Konekti.vc('log').innerHTML = 'The winner is ' + x.winner
        }

        board.print(x.rb)
        setTimeout(clock, 1000)
        setTimeout(compute, 1000)
    }
}

// Drawing commands
function custom_commands(){
    return [
        { 
            "command":" ", "commands":[
                {
                    "command":"fillStyle",
                    "color":{"red":255, "green":255, "blue":255, "alpha":255}
                },
                {
                    "command":"polygon",
                    "x":[0.2,0.2,0.8,0.8],
                    "y":[0.2,0.8,0.8,0.2]
                }

            ]},
        { 
            "command":"-", 
            "commands":[
                {
                    "command":"strokeStyle",
                    "color":{"red":128, "green":128, "blue":128, "alpha":255}
                },
                {
                    "command":"polyline",
                    "x":[0,0,1,1,0],
                    "y":[0,1,1,0,0]
                }
            ]
        },
        { 
            "command":"u", 
            "commands":[
                {
                    "command":"strokeStyle",
                    "color":{"red":0, "green":0, "blue":255, "alpha":255}
                },
                {
                    "command":"polyline",
                    "x":[0,1],
                    "y":[0,0]
                }
            ]
        },
        { 
            "command":"d", 
            "commands":[
                {
                    "command":"strokeStyle",
                    "color":{"red":0, "green":0, "blue":255, "alpha":255}
                },
                {
                    "command":"polyline",
                    "x":[0,1],
                    "y":[1,1]
                }
            ]
        },
        { 
            "command":"r", 
            "commands":[
                {
                    "command":"strokeStyle",
                    "color":{"red":0, "green":0, "blue":255, "alpha":255}
                },
                {
                    "command":"polyline",
                    "x":[1,1],
                    "y":[0,1]
                }
            ]
        },
        { 
            "command":"l", 
            "commands":[
                {
                    "command":"strokeStyle",
                    "color":{"red":0, "green":0, "blue":255, "alpha":255}
                },
                {
                    "command":"polyline",
                    "x":[0,0],
                    "y":[0,1]
                }
            ]
        },
        {
            "command":"R",
            "commands":[
                {
                    "command":"fillStyle",
                    "color":{"red":255, "green":0, "blue":0, "alpha":255}
                },
                {
                    "command":"polygon",
                    "x":[0.2,0.2,0.8,0.8],
                    "y":[0.2,0.8,0.8,0.2]
                }
            ]
        },  
        {
            "command":"Y",
            "commands":[
                {
                    "command":"fillStyle",
                    "color":{"red":255, "green":255, "blue":0, "alpha":255}
                },
                {
                    "command":"polygon",
                    "x":[0.2,0.2,0.8,0.8],
                    "y":[0.2,0.8,0.8,0.2]
                },
            ]
        }
    ] 
}

class UNemployed extends Agent {
    constructor() {
        super();
        this.boardOp = new Board();
        this.transpositionTable = new Map();
    }

    init(color, board, time = 20000) {
        super.init(color, board, time);
        this.myId = color === 'R' ? -1 : -2;
        this.oppId = color === 'R' ? -2 : -1;
        this.totalInitialMoves = (board.length * board.length * 2) + (board.length * 2);
    }

    /**
     * Fast integer hashing for the Transposition Table.
     */
    hashBoard(board) {
        let h = 0;
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board.length; j++) {
                h = Math.imul(31, h) + board[i][j] | 0;
            }
        }
        return h;
    }

    /**
     * Move Ordering: The most critical optimization for 50x50 boards.
     * Evaluates available lines and sorts them: Captures first, safe moves next, dangerous moves last.
     */
    getOrderedMoves(board) {
        let captures = [];
        let safeMoves = [];
        let dangerousMoves = [];
        let size = board.length;

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                let v = board[i][j];
                if (v < 0) continue; // Box already claimed

                let lines = ((v & 1) ? 1 : 0) + ((v & 2) ? 1 : 0) + ((v & 4) ? 1 : 0) + ((v & 8) ? 1 : 0);
                
                // Only evaluate Right (1) and Down (2) for internal grid to prevent duplicates
                let checkSides = [1, 2];
                if (i === 0) checkSides.push(0); // Top edge
                if (j === 0) checkSides.push(3); // Left edge

                for (let s of checkSides) {
                    if (this.boardOp.check(board, i, j, s)) {
                        let move = [i, j, s];
                        if (lines === 3) {
                            captures.push(move); // Immediate point!
                        } else if (lines === 2) {
                            dangerousMoves.push(move); // Gives the opponent a 3-sided box
                        } else {
                            safeMoves.push(move); // 0 or 1 sided boxes
                        }
                    }
                }
            }
        }
        
        // Return captures first, then safe moves. If nothing else is left, return dangerous moves.
        return [...captures, ...safeMoves, ...dangerousMoves];
    }

    evaluate(board) {
        let score = 0;
        let size = board.length;
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                let v = board[i][j];
                
                if (v === this.myId) score += 1000;
                else if (v === this.oppId) score -= 1000;
                else if (v >= 0) {
                    let lines = ((v & 1) ? 1 : 0) + ((v & 2) ? 1 : 0) + ((v & 4) ? 1 : 0) + ((v & 8) ? 1 : 0);
                    if (lines === 2) score -= 5; // Danger penalty
                }
            }
        }
        return score;
    }

    compute(board, time) {
        let startTime = Date.now();
        let moves = this.getOrderedMoves(board);
        
        // Failsafe: If no moves or game over, return a default
        if (moves.length === 0) return [0, 0, 0]; 

        // Dynamic Time Management
        // Calculate how many moves we likely have left to make
        let remainingTotalMoves = moves.length;
        let expectedMyMoves = Math.ceil(remainingTotalMoves / 2);
        
        // Allocate time. Keep a 10% buffer for execution delays.
        let timeLimit = (time / expectedMyMoves) * 0.9;
        
        // Absolute limits to prevent freezing and ensure we never forfeit
        if (timeLimit > 1000) timeLimit = 1000; 
        if (timeLimit < 10) timeLimit = 10; 

        // If time is critically low (< 15ms), don't even try to search. 
        // Just return the best-ordered move immediately.
        if (timeLimit <= 15) {
            return moves[0];
        }

        let bestMove = moves[0];
        this.transpositionTable.clear(); // Clear TT between turns to manage memory

        // Iterative Deepening
        for (let depth = 1; depth <= 5; depth++) { 
            let result = this.minimaxRoot(board, depth, true, startTime, timeLimit, moves);
            
            if (result.timeout) break; // Timer expired, use best move from previous depth
            
            if (result.move) bestMove = result.move;
            
            // If we found a forced win/loss, stop searching
            if (result.score > 9000 || result.score < -9000) break; 
        }

        return bestMove;
    }

    minimaxRoot(board, depth, isMaximizing, startTime, timeLimit, moves) {
        let bestMove = null;
        let bestScore = -Infinity;
        let alpha = -Infinity;
        let beta = Infinity;

        for (let move of moves) {
            if (Date.now() - startTime >= timeLimit) {
                return { timeout: true };
            }

            let bClone = this.boardOp.clone(board);
            this.boardOp.move(bClone, move[0], move[1], move[2], this.myId);
            
            let score = this.minimax(bClone, depth - 1, alpha, beta, false, startTime, timeLimit);

            if (score === null) return { timeout: true }; // Propagate timeout

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            alpha = Math.max(alpha, bestScore);
        }
        return { move: bestMove, score: bestScore };
    }

    minimax(board, depth, alpha, beta, isMaximizing, startTime, timeLimit) {
        if (Date.now() - startTime >= timeLimit) return null; // Signal timeout

        let hash = this.hashBoard(board);
        if (this.transpositionTable.has(hash)) {
            let cached = this.transpositionTable.get(hash);
            if (cached.depth >= depth) return cached.score;
        }

        let moves = this.getOrderedMoves(board);
        if (depth === 0 || moves.length === 0) {
            let score = this.evaluate(board);
            this.transpositionTable.set(hash, { depth: depth, score: score });
            return score;
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let move of moves) {
                let bClone = this.boardOp.clone(board);
                this.boardOp.move(bClone, move[0], move[1], move[2], this.myId);
                
                let evalScore = this.minimax(bClone, depth - 1, alpha, beta, false, startTime, timeLimit);
                if (evalScore === null) return null;

                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break; // Alpha-Beta Pruning
            }
            this.transpositionTable.set(hash, { depth: depth, score: maxEval });
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let move of moves) {
                let bClone = this.boardOp.clone(board);
                this.boardOp.move(bClone, move[0], move[1], move[2], this.oppId);
                
                let evalScore = this.minimax(bClone, depth - 1, alpha, beta, true, startTime, timeLimit);
                if (evalScore === null) return null;

                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break; // Alpha-Beta Pruning
            }
            this.transpositionTable.set(hash, { depth: depth, score: minEval });
            return minEval;
        }
    }
}