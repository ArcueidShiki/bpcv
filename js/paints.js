// 溢彩画游戏 JavaScript
class FloodFillGame {
    constructor() {
        this.colors = [
            '#f1c40f', // 黄色
            '#e74c3c', // 红色
            '#3498db', // 蓝色
            '#27ae60'  // 绿色
        ];
        this.colorNames = ['黄', '红', '蓝', '绿'];

        this.gridSize = this.getRandomGridSize(); // 随机网格大小
        this.colorCount = 3;
        this.maxMoves = 8;
        this.currentMoves = 0;
        this.targetColor = 0;
        this.selectedColor = 0; // 当前选择的颜色
        this.grid = [];
        this.originalGrid = [];
        this.gameEnded = false;

        this.init();
    }

    getRandomGridSize() {
        return Math.floor(Math.random() * 7) + 6; // 6-12 的随机大小
    }

    init() {
        this.generateGrid();
        this.chooseTargetColor();
        this.renderGrid();
        this.updateUI();
        this.updateColorSelection(); // 初始化颜色选择状态
    }

    // 生成可解的网格
    generateGrid() {
        // 先创建一个单色网格
        this.grid = Array(this.gridSize).fill().map(() =>
            Array(this.gridSize).fill(0)
        );

        // 随机选择起始颜色（不是目标颜色）
        let availableColors = [];
        for (let i = 0; i < this.colorCount; i++) {
            availableColors.push(i);
        }

        // 执行反向flood fill来创建复杂但可解的布局
        this.generateSolvablePattern();

        // 保存原始网格用于重试功能
        this.originalGrid = this.grid.map(row => [...row]);
        this.currentMoves = 0;
        this.gameEnded = false;
    }

    generateSolvablePattern() {
        // 从中心开始，创建分层的颜色分布
        const centerX = Math.floor(this.gridSize / 2);
        const centerY = Math.floor(this.gridSize / 2);

        // 使用BFS来创建层次分布
        const queue = [{ x: centerX, y: centerY, layer: 0 }];
        const visited = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

        while (queue.length > 0) {
            const { x, y, layer } = queue.shift();

            if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize || visited[x][y]) {
                continue;
            }

            visited[x][y] = true;

            // 根据层数和一些随机性分配颜色
            let colorIndex;
            if (layer === 0) {
                colorIndex = Math.floor(Math.random() * this.colorCount);
            } else {
                // 增加颜色变化的概率
                const changeProb = Math.min(0.4 + layer * 0.1, 0.8);
                if (Math.random() < changeProb) {
                    colorIndex = Math.floor(Math.random() * this.colorCount);
                } else {
                    // 使用邻居的颜色
                    const neighbors = this.getValidNeighbors(x, y);
                    if (neighbors.length > 0) {
                        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                        colorIndex = this.grid[randomNeighbor.x][randomNeighbor.y];
                    } else {
                        colorIndex = Math.floor(Math.random() * this.colorCount);
                    }
                }
            }

            this.grid[x][y] = colorIndex;

            // 添加邻居到队列
            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize && !visited[nx][ny]) {
                    queue.push({ x: nx, y: ny, layer: layer + 1 });
                }
            }
        }

        // 添加一些随机扰动来增加复杂性
        this.addRandomNoise();
    }

    getValidNeighbors(x, y) {
        const neighbors = [];
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                neighbors.push({ x: nx, y: ny });
            }
        }
        return neighbors;
    }

    addRandomNoise() {
        // 随机改变一些格子的颜色来增加游戏难度
        const noiseCount = Math.floor(this.gridSize * this.gridSize * 0.1);

        for (let i = 0; i < noiseCount; i++) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            this.grid[x][y] = Math.floor(Math.random() * this.colorCount);
        }
    }

    chooseTargetColor() {
        // 选择一个目标颜色（与当前左上角不同的颜色）
        const currentTopLeftColor = this.grid[0][0];
        const availableTargets = [];

        for (let i = 0; i < this.colorCount; i++) {
            if (i !== currentTopLeftColor) {
                availableTargets.push(i);
            }
        }

        this.targetColor = availableTargets[Math.floor(Math.random() * availableTargets.length)];
    }

    renderGrid() {
        const gridElement = document.getElementById('gameGrid');
        const cellSize = Math.max(30, Math.min(40, 400 / this.gridSize)); // 根据网格大小调整格子尺寸
        gridElement.style.gridTemplateColumns = `repeat(${this.gridSize}, ${cellSize}px)`;
        gridElement.innerHTML = '';

        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.backgroundColor = this.colors[this.grid[i][j]];
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;
                cell.addEventListener('click', () => this.onCellClick(i, j));
                cell.dataset.row = i;
                cell.dataset.col = j;
                gridElement.appendChild(cell);
            }
        }
    }

    onCellClick(row, col) {
        if (this.gameEnded) return;

        const clickedColor = this.grid[row][col];

        // 如果点击的格子颜色与选择的颜色相同，不执行操作
        if (clickedColor === this.selectedColor) return;

        this.currentMoves++;
        this.floodFill(row, col, clickedColor, this.selectedColor);
        this.updateUI();
        this.checkGameEnd();
    }

    async floodFill(startRow, startCol, originalColor, newColor) {
        if (originalColor === newColor) return;

        const visited = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        const stack = [{ row: startRow, col: startCol }];
        const animationCells = [];

        while (stack.length > 0) {
            const { row, col } = stack.pop();

            if (row < 0 || row >= this.gridSize ||
                col < 0 || col >= this.gridSize ||
                visited[row][col] ||
                this.grid[row][col] !== originalColor) {
                continue;
            }

            visited[row][col] = true;
            this.grid[row][col] = newColor;
            animationCells.push({ row, col });

            // 添加四个方向的邻居
            stack.push({ row: row + 1, col: col });
            stack.push({ row: row - 1, col: col });
            stack.push({ row: row, col: col + 1 });
            stack.push({ row: row, col: col - 1 });
        }

        // 执行动画
        await this.animateColorChange(animationCells, newColor);
    }

    async animateColorChange(cells, newColor) {
        return new Promise(resolve => {
            cells.forEach((cell, index) => {
                setTimeout(() => {
                    const cellElement = document.querySelector(
                        `[data-row="${cell.row}"][data-col="${cell.col}"]`
                    );
                    if (cellElement) {
                        cellElement.classList.add('animating');
                        cellElement.style.backgroundColor = this.colors[newColor];

                        setTimeout(() => {
                            cellElement.classList.remove('animating');
                            if (index === cells.length - 1) {
                                resolve();
                            }
                        }, 300);
                    }
                }, index * 50);
            });
        });
    }

    checkGameEnd() {
        // 检查是否所有格子都是目标颜色
        const allSameColor = this.grid.every(row =>
            row.every(cell => cell === this.targetColor)
        );

        if (allSameColor) {
            this.gameEnded = true;
            this.showGameStatus('恭喜！你成功完成了溢彩画！🎉', 'status-success');
        } else if (this.currentMoves >= this.maxMoves) {
            this.gameEnded = true;
            this.showGameStatus('游戏结束！步数用完了，再试试看吧！😔', 'status-failure');
        }
    }

    showGameStatus(message, className) {
        const statusElement = document.getElementById('gameStatus');
        statusElement.textContent = message;
        statusElement.className = `game-status ${className}`;
        statusElement.classList.remove('hidden');
    }

    hideGameStatus() {
        const statusElement = document.getElementById('gameStatus');
        statusElement.classList.add('hidden');
    }

    updateUI() {
        document.getElementById('movesLeft').textContent = this.maxMoves - this.currentMoves;
        document.getElementById('targetColorDisplay').style.backgroundColor = this.colors[this.targetColor];
        document.getElementById('gridSizeInfo').textContent = `${this.gridSize}x${this.gridSize}`;
        document.getElementById('colorCountInfo').textContent = this.colorCount;
    }

    // 降低难度：增加操作次数
    reduceDifficulty() {
        this.maxMoves += 3;
        this.updateUI();
        this.hideGameStatus();
        this.gameEnded = false;
    }

    // 再来一次：重置到初始状态
    retryGame() {
        this.grid = this.originalGrid.map(row => [...row]);
        this.currentMoves = 0;
        this.gameEnded = false;
        this.renderGrid();
        this.updateUI();
        this.hideGameStatus();
    }

    // 新游戏：生成新的布局
    newGame() {
        // 随机调整游戏参数
        this.gridSize = this.getRandomGridSize(); // 每次新游戏随机网格大小

        if (Math.random() < 0.3) {
            this.colorCount = Math.random() < 0.5 ? 3 : 4;
        }

        // 根据难度调整步数
        this.maxMoves = Math.floor(this.gridSize * 1.2) + this.colorCount;

        this.init();
        this.hideGameStatus();
    }

    // 选择颜色
    selectColor(colorIndex) {
        this.selectedColor = colorIndex;
        this.updateColorSelection();
    }

    updateColorSelection() {
        // 更新颜色面板的选中状态
        document.querySelectorAll('.color-sample').forEach((sample, index) => {
            if (index === this.selectedColor) {
                sample.classList.add('selected');
            } else {
                sample.classList.remove('selected');
            }
        });
    }
}

// 游戏实例
let game;

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    game = new FloodFillGame();
});

// 全局函数供HTML调用
function reduceDifficulty() {
    game.reduceDifficulty();
}

function retryGame() {
    game.retryGame();
}

function newGame() {
    game.newGame();
}

function selectColor(colorIndex) {
    game.selectColor(colorIndex);
}
