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
