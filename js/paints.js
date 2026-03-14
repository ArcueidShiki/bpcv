// ── Sound Engine (Web Audio API) — Water Drop ────────────────────────────────
const SoundEngine = (function () {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Color base pitches: warm tones per color
  const BASE_FREQ = [680, 820, 600, 740]; // yellow, red, blue, green

  // Single water-drop: frequency sweeps down quickly (high impact -> resonance decay)
  function playDrop(t, freq, vol, decay) {
    try {
      var c = getCtx();

      var osc = c.createOscillator();
      var filter = c.createBiquadFilter();
      var gain = c.createGain();

      osc.type = 'sine';
      // Sharp high-freq start, sweep down to resonant frequency
      osc.frequency.setValueAtTime(freq * 2.2, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.025);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + decay);

      // Resonant lowpass gives the hollow "dong" quality
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3, t);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.9, t + decay * 0.6);
      filter.Q.value = 8;

      // Fast attack, exponential ring-out
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + decay + 0.01);
    } catch (e) { /* ignore */ }
  }

  // Progressive water-drop effect: sparse/deep early, dense/crisp as wave expands
  function playFlip(colorIndex, groupIndex, totalGroups) {
    try {
      var c = getCtx();
      var progress = totalGroups > 1 ? groupIndex / (totalGroups - 1) : 0;

      var baseFreq = BASE_FREQ[colorIndex % BASE_FREQ.length];
      // Early waves: lower pitch, longer decay, quieter
      // Late waves: higher pitch, shorter crisp decay, slightly louder
      var freq  = baseFreq * (0.75 + progress * 0.6);
      var vol   = 0.06 + progress * 0.05;
      var decay = 0.22 - progress * 0.14; // 220ms → 80ms

      playDrop(c.currentTime, freq, vol, decay);
    } catch (e) { /* ignore */ }
  }

  function playSuccess() {
    try {
      var c = getCtx();
      // Ascending water-drop chime
      var freqs = [520, 660, 780, 1040];
      freqs.forEach(function (freq, i) {
        var t = c.currentTime + i * 0.08;
        playDrop(t, freq, 0.13, 0.35);
      });
    } catch (e) { /* ignore */ }
  }

  return { playFlip: playFlip, playSuccess: playSuccess };
})();

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
        this.colorCount = 4; // 使用所有4种颜色，包括绿色
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
        return Math.floor(Math.random() * 7) + 8; // 8-14 的随机大小
    }

    // 添加设置网格大小的方法
    setGridSize(size) {
        this.gridSize = Math.max(6, Math.min(30, size));
        this.init();
        // 更新页面显示
        const gridSizeDisplay = document.getElementById('grid-size-display');
        if (gridSizeDisplay) {
            gridSizeDisplay.textContent = this.gridSize;
        }
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
        // 增大格子大小，响应式设计
        const containerWidth = Math.min(window.innerWidth * 0.9, 800);
        const cellSize = Math.max(25, Math.min(50, containerWidth / this.gridSize));
        
        gridElement.style.gridTemplateColumns = `repeat(${this.gridSize}, ${cellSize}px)`;
        gridElement.style.gridTemplateRows = `repeat(${this.gridSize}, ${cellSize}px)`;
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

        // 先收集所有需要染色的格子
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
            
            // 计算到起始点的距离
            const distance = Math.sqrt((row - startRow) ** 2 + (col - startCol) ** 2);
            animationCells.push({ row, col, distance });

            // 添加四个方向的邻居
            stack.push({ row: row + 1, col: col });
            stack.push({ row: row - 1, col: col });
            stack.push({ row: row, col: col + 1 });
            stack.push({ row: row, col: col - 1 });
        }

        // 按距离排序，实现圆形扩散效果
        animationCells.sort((a, b) => a.distance - b.distance);

        // 执行动画
        await this.animateColorChangeRadial(animationCells, newColor, startRow, startCol);
    }

    async animateColorChangeRadial(cells, newColor, centerRow, centerCol) {
        return new Promise(resolve => {
            // 按距离分组，同一距离的格子同时动画
            const distanceGroups = {};
            cells.forEach(cell => {
                const distance = Math.round(cell.distance * 2) / 2; // 保留0.5精度，让扩散更平滑
                if (!distanceGroups[distance]) {
                    distanceGroups[distance] = [];
                }
                distanceGroups[distance].push(cell);
            });

            const distances = Object.keys(distanceGroups).map(d => parseFloat(d)).sort((a, b) => a - b);
            let groupIndex = 0;
            let totalGroups = distances.length;

            const animateNextGroup = () => {
                if (groupIndex >= distances.length) {
                    resolve();
                    return;
                }

                const distance = distances[groupIndex];
                const group = distanceGroups[distance];
                // Progressive water drop: each ring gets its own tonal character
                SoundEngine.playFlip(newColor, groupIndex, totalGroups);
                
                // 同一距离的所有格子同时开始动画，但加入一点随机延迟让效果更自然
                group.forEach((cell, index) => {
                    const randomDelay = Math.random() * 30; // 0-30ms的随机延迟
                    
                    setTimeout(() => {
                        const cellElement = document.querySelector(
                            `[data-row="${cell.row}"][data-col="${cell.col}"]`
                        );
                        if (cellElement) {
                            cellElement.classList.add('animating');
                            cellElement.style.backgroundColor = this.colors[newColor];

                            setTimeout(() => {
                                cellElement.classList.remove('animating');
                            }, 500);
                        }
                    }, randomDelay);
                });

                groupIndex++;
                // 根据距离动态调整延迟，距离越远延迟越短，营造加速效果
                const baseDelay = Math.max(30, 120 - groupIndex * 3);
                setTimeout(animateNextGroup, baseDelay);
            };

            animateNextGroup();
        });
    }

    checkGameEnd() {
        // 检查是否所有格子都是目标颜色
        const allSameColor = this.grid.every(row => 
            row.every(cell => cell === this.targetColor)
        );

        if (allSameColor) {
            this.gameEnded = true;
            this.showSuccessMessage();
        } else if (this.currentMoves >= this.maxMoves) {
            this.gameEnded = true;
            this.showFailureMessage();
        }
    }    showGameStatus(message, className) {
        const statusElement = document.getElementById('gameStatus');
        statusElement.textContent = message;
        statusElement.className = `game-status ${className}`;
        statusElement.classList.remove('hidden');
    }

    showSuccessMessage() {
        const message = translations.messages?.success || '恭喜！你成功完成了溢彩画！🎉';
        this.showGameStatus(message, 'status-success');
        SoundEngine.playSuccess();
    }

    showFailureMessage() {
        const message = translations.messages?.failure || '游戏结束！步数用完了，再试试看吧！😔';
        this.showGameStatus(message, 'status-failure');
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
        // 更新侧边栏颜色面板的选中状态
        document.querySelectorAll('.color-sample').forEach((sample, index) => {
            if (index === this.selectedColor) {
                sample.classList.add('selected');
            } else {
                sample.classList.remove('selected');
            }
        });
    }
}

// 全局变量
let game;
let currentLanguage = 'en';
let translations = {};

// 检查文件是否存在
async function checkFileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

// 加载翻译文件
async function loadTranslations(lang) {
    try {
        const url = `js/langs/paints-${lang}.json`;
        
        // 先检查文件是否存在
        const exists = await checkFileExists(url);
        if (!exists) {
            throw new Error(`File not found: ${url}`);
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        if (!text.trim()) {
            throw new Error('Empty response');
        }
        
        const data = JSON.parse(text);
        translations = data;
        return true;
    } catch (error) {
        
        // Fallback to English translations
        if (lang !== 'en') {
            return await loadTranslations('en');
        }
        
        // 如果中文也加载失败，使用硬编码的备用翻译
        translations = {
            title: "🎨 溢彩画游戏",
            ui: {
                movesLeft: "剩余步数",
                targetColor: "目标颜色",
                gridSize: "网格大小",
                colorCount: "颜色数量",
                instruction: "选择颜色后点击格子进行染色",
                gridSizeSlider: "调整网格大小",
                colorNames: ["黄", "红", "蓝", "绿"]
            },
            buttons: {
                reduceDifficulty: "降低难度",
                retry: "再来一次",
                newGame: "新游戏"
            },
            messages: {
                success: "恭喜！你成功完成了溢彩画！🎉",
                failure: "游戏结束！步数用完了，再试试看吧！😔"
            }
        };
        return true;
    }
}

// 更新界面文本
function updateUITexts() {
    if (!translations || !translations.title) {
        return;
    }
    
    // 更新所有文本元素
    const elements = {
        'gameTitle': translations.title,
        'movesLeftLabel': translations.ui.movesLeft,
        'targetColorLabel': translations.ui.targetColor,
        'gridSizeLabel': translations.ui.gridSize,
        'colorCountLabel': translations.ui.colorCount,
        'instructionText': translations.ui.instruction,
        'gridSizeSliderLabel': translations.ui.gridSizeSlider,
        'reduceDifficultyBtn': translations.buttons.reduceDifficulty,
        'retryBtn': translations.buttons.retry,
        'newGameBtn': translations.buttons.newGame
    };
    
    for (const [id, text] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        } else {
        }
    }
    
    // 更新颜色提示
    updateColorTooltips();
}

// 更新颜色提示
function updateColorTooltips() {
    if (!translations.ui || !translations.ui.colorNames) return;
    
    const colorSamples = document.querySelectorAll('.color-sample');
    colorSamples.forEach((sample, index) => {
        if (translations.ui.colorNames[index]) {
            sample.title = translations.ui.colorNames[index];
        }
    });
}

// 切换语言
async function switchLanguage(newLang) {
    currentLanguage = newLang;
    
    const success = await loadTranslations(newLang);
    
    // 无论加载是否成功，都尝试更新UI
    updateUITexts();
    
    // 更新游戏对象的语言
    if (game && translations) {
        game.currentLanguage = newLang;
        game.translations = translations;
        if (translations.ui && translations.ui.colorNames) {
            game.colorNames = translations.ui.colorNames;
        }
    }
    
    // 更新语言按钮显示
    updateLanguageButtonDisplay(newLang);
}

// 语言切换功能
function setupLanguageSelector() {
    
    const languageBtn = document.getElementById('languageBtn');
    const languageDropdown = document.getElementById('languageDropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    
    if (!languageBtn || !languageDropdown) {
        return;
    }
    
    // 切换下拉菜单
    languageBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        languageDropdown.classList.toggle('active');
    });
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', function() {
        languageDropdown.classList.remove('active');
    });
    
    // 处理语言选择
    languageOptions.forEach(function(option) {
        option.addEventListener('click', async function(e) {
            e.stopPropagation();
            
            const selectedLang = option.getAttribute('data-lang');
            const flag = option.querySelector('.flag').textContent;
            const langName = option.querySelector('span:last-child').textContent;
            
            // 更新按钮显示
            const langText = document.getElementById('langText');
            const langFlag = document.getElementById('langFlag');
            
            if (langText && langFlag) {
                langText.textContent = selectedLang.toUpperCase();
                langFlag.textContent = flag;
            }
            
            // 切换语言
            await switchLanguage(selectedLang);
            
            // 关闭下拉菜单
            languageDropdown.classList.remove('active');
        });
    });
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', async function() {
    
    try {
        // Load default English translations
        const success = await loadTranslations('en');
        
        // 创建游戏实例
        game = new FloodFillGame();
        
        // 设置语言选择器
        setupLanguageSelector();
        
        // 应用初始翻译
        updateUITexts();
    } catch (error) {
        
        // 即使出错也要创建游戏实例
        try {
            game = new FloodFillGame();
            setupLanguageSelector();
        } catch (gameError) {
        }
    }
});

function updateLanguageButtonDisplay(lang) {
    const langText = document.getElementById('langText');
    const langFlag = document.getElementById('langFlag');
    
    if (langText && langFlag) {
        if (lang === 'zh') {
            langText.textContent = 'ZH';
            langFlag.textContent = '🇨🇳';
        } else {
            langText.textContent = 'EN';
            langFlag.textContent = '🇺🇸';
        }
    }
}

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

// 添加网格大小调整函数
function setGridSize(size) {
    if (game) {
        game.setGridSize(parseInt(size));
    }
}

// 添加窗口大小变化时的响应
window.addEventListener('resize', function() {
    if (game) {
        game.renderGrid();
    }
});
