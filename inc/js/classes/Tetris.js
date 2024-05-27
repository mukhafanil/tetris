export default class Tetris {
    #figures = { // Объект с фигурами
        'O': {
            color: '#ecce00',
            matrix: [
                [1, 1],
                [1, 1],
            ],
        },
        'I': {
            color: '#2bdfdf',
            matrix: [
                [0, 0, 0 ,0],
                [1, 1, 1 ,1],
                [0, 0, 0 ,0],
                [0, 0, 0 ,0],
            ]
        },
        'T': {
            color: '#8f00a8',
            matrix: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0],
            ],
        },
        'J': {
            color: '#0c00c9',
            matrix: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0],
            ],
        },
        'L': {
            color: '#ec7f21',
            matrix: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0],
            ],
        },
        'S': {
            color: '#2e901b',
            matrix: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0],
            ],
        },
        'Z': {
            color: '#be070f',
            matrix: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0],
            ],
        },
    }
    #params = {}; // Параметры игры
    #gamePoints = 0;

    #tetrisHTML = null; // DOM обертка всего тетриса
    #playGrid = null; // DOM сетка (grid) игрового поля
    #playGridCells = null; // DOM список ячеек игрового поля
    #playGridMatrix = null; // Будущий двумерный массив (сетка) игрового поля
    #playGridRows = 20; // Кол-во строк игрового поля по умолчанию
    #playGridColumns = 10; // Кол-во колонок игрового поля по умолчанию

    #keydownFuncName = null;
    #timerId = null;
    #requestId = null;

    #currentFigure = null // Текущая фигура
    #nextFigure = null // Следующая фигура
    #nextFigureDOM = null // Следующая фигура DOM

    #isGamePause = false;
    #isGameOver = false;

    #soundGame =  new Audio('./inc/sounds/game.mp3');
    #soundGameOver =  new Audio('./inc/sounds/gameover.mp3');
    #soundPlaceFigure = new Audio('./inc/sounds/place-figure.mp3');


    constructor(params) {
        this.#params = params;

        this.#setPlayGridSize(); // Устанавливаем ширину и высоту сетки.
        this.#createTetrisHTML(); // Создаем HTML тетриса
    }

    // Устанавливаем ширину и высоту сетки
    #setPlayGridSize() {
        this.#playGridRows = Math.max(14, Number(this.#params.rows) ? Number(this.#params.rows) : this.#playGridRows);
        this.#playGridColumns = Math.max(6, Number(this.#params.columns) ? Number(this.#params.columns) : this.#playGridColumns);
    }
    // Создание HTML тетриса
    #createTetrisHTML() {
        try {
            this.#tetrisHTML = document.querySelector(this.#params.selector);
            this.#tetrisHTML.classList.add('tetris');

            this.#createFigureStyles(); // Создание стилей фигурки
            this.#createControlButtons(); // Создание кнопок
            this.#createGamePoints(); // Создание очков
            this.#createPlayGrid(); // Создаем игровое поле
            this.#createNextFigureHTML(); // Создаем поле со следующей фигурой
        } catch(err) {
            //console.log(err);
            alert('Обертки тетриса с таким селектором не существует');
        }
    }

    // Создание стилей фигурок
    #createFigureStyles() {
        let styles = document.createElement('style'),
            figures = this.#figures;

        for (let key in figures) { // Перебираем объект c фигурами и вставляем цвет
            styles.textContent +=
                `.tetris .tetris__grid > div.${key},
                 .tetris .tetris__next-figure > div.${key} { 
                    background: ${figures[key].color}; 
                    box-shadow: inset 0 0 3px rgba(255, 255, 255, 1); 
                } \n`;
        }
        this.#tetrisHTML.append(styles);
    }
    // Создание игрового поля (сетки) DOM
    #createPlayGrid() {
        this.#playGrid = document.createElement('div');
        this.#playGrid.classList.add('tetris__grid');
        this.#playGrid.style.gridTemplateColumns = 'repeat(' + this.#playGridColumns + ', 1fr)';

        this.#createTetrisCells(); // Создание ячеек внутри игрового поля
        this.#tetrisHTML.append(this.#playGrid); // Добавляем созданное игровое поле (вместе с сеткой) в HTML тетриса
    }
    // Создание матрицы и создание ячеек внутри игрового поля DOM
    #createTetrisCells() {
        this.#playGridMatrix = new Array(this.#playGridRows) // Строки
            .fill()
            .map(() => new Array(this.#playGridColumns).fill(0)); // Колонки

        const cellsList = new DocumentFragment(); // Создаем фрагмент DOM, чтобы 1000 раз не изменять дом
        let cellsCount = this.#playGridRows * this.#playGridColumns; // Количество ячеек
        for (let i = 0; i < cellsCount; i++) { // Чтобы код более читабельный не стал перебирать двумерный массив
            let cell = document.createElement('div');
            cellsList.append(cell); // Добавляем ячейки в фрагмент DOM
        }

        this.#playGrid.append(cellsList); // Вставляем фрагмент DOM одной пачкой
        this.#playGridCells = this.#playGrid.querySelectorAll('div'); // Записываем в DOM все добавленные ячейки
    }
    // Создание игровых очков DOM
    #createGamePoints() {
        let gamePointsDOM = document.createElement('div');
        gamePointsDOM.classList.add('tetris__points-wrap');
        gamePointsDOM.innerHTML = `
            <span>Очки:</span>
            <span class="tetris__points-value">0</span>
        `;

        this.#tetrisHTML.append(gamePointsDOM);
    }

    // Запуск игры
    play() {
        this.#initKeydown(); // Инициализация нажатия клавиш
        this.#createFigureMain(); // Общая функция создания фигур
        this.#render(); // Рендер основной

        this.#moveFigureDown();
        this.#playGameSound();
    }

    // Инициализация и удаление нажатий клавиш
    #initKeydown() {
        this.#keydownFuncName = this.#onKeyDown.bind(this);
        document.addEventListener('keydown', this.#keydownFuncName);
    }
    #unInitKeydown() {
        document.removeEventListener('keydown', this.#keydownFuncName);
    }
    #onKeyDown(event) {
        if(this.#isGamePause) return;
        switch (event.key) {
            case 'ArrowUp':
                this.#rotateFigure();
                break;
            case 'ArrowDown':
                this.#moveFigureDown();
                break;
            case 'ArrowLeft':
                this.#moveFigureLeft();
                break;
            case 'ArrowRight':
                this.#moveFigureRight();
                break;
            case ' ':
                this.#dropFigureDown();
                break;
            default:
                return;
        }
    }

    // Общая функция создания фигур
    #createFigureMain() {
        if(this.#currentFigure === null) {
            this.#currentFigure = this.#getRandomFigure(); // При первом создании фигуры нет следующей фигуры
            this.#nextFigure = this.#getRandomFigure();
        } else {
            this.#currentFigure = this.#nextFigure;
            this.#nextFigure = this.#getRandomFigure();
        }

        this.#calculateGhostPosition();
    }
    // Получаем объект рандомной фигуры
    #getRandomFigure() {
        let name = this.#getRandomFigureName(),
            matrix = this.#figures[name].matrix,
            currentColumn = this.#playGridColumns / 2 - Math.ceil(matrix.length / 2),
            currentRow = -2;

        return {
            name,
            matrix,
            currentColumn,
            currentRow,
            ghostColumn: currentColumn,
            ghostRow: currentRow,
        }
    }
    // Получаем название рандомной фигуры
    #getRandomFigureName() {
        let figuresArray = Object.entries(this.#figures), // Делаем из объекта массив, чтобы получить число элементов (фигур)
            randomFigureIndex = Math.floor(Math.random() * figuresArray.length);

        return figuresArray[ randomFigureIndex ][0] // Первый элемент массива - это буква
    }

    // Основной рендер
    #render() {
        this.#playGridCells.forEach((cell) => {
            cell.removeAttribute('class'); // Очищаем ячейки
            this.#renderPlayGrid(); // Рендер игрового поля
            this.#renderFigure(); // Рендер фигуры
            this.#renderGhostFigure(); // Рендер призрачной фигуры
            this.#renderNextFigure(); // Рендер следующей фигуры

            //console.table(this.#playGridMatrix);
        });
    }
    // Рендер игрового поля от матрицы
    #renderPlayGrid() {
        for (let row = 0; row < this.#playGridRows; row++) {
            for (let column = 0; column < this.#playGridColumns; column++) {
                if(this.#playGridMatrix[row][column] === 0) continue; // Пропускаем если в ячейке матрицы фигуры встречается 0,
                let figureName = this.#playGridMatrix[row][column]; // У нас в матрице в определенной позиции записана буква
                let cellIndex = this.#getIndexFromPosition(row, column); // Вычисляем индекс в сетке DOM
                this.#playGridCells[cellIndex].classList.add(figureName); // Вставляем класс буквы для окрашивания
            }
        }
    }
    // Рендер фигуры
    #renderFigure() {
        let figureName = this.#currentFigure.name,
            figureMaxSize = this.#currentFigure.matrix.length;

        for (let row = 0; row < figureMaxSize; row++) {
            for (let column = 0; column < figureMaxSize; column++) {
                if(this.#currentFigure.matrix[row][column] === 0) continue; // Пропускаем если в ячейке матрицы фигуры встречается 0,
                if(this.#currentFigure.currentRow + row < 0) continue; // Пропускаем если фигура за игровым полем (выше), пропускаем
                let cellIndex = this.#getIndexFromPosition(
                    this.#currentFigure.currentRow + row,
                    this.#currentFigure.currentColumn + column
                );
                this.#playGridCells[cellIndex].classList.add(figureName);
            }
        }
    }
    // Рендер призрачной фигуры
    #renderGhostFigure() {
        let figureMaxSize = this.#currentFigure.matrix.length;

        for (let row = 0; row < figureMaxSize; row++) {
            for (let column = 0; column < figureMaxSize; column++) {
                if(this.#currentFigure.matrix[row][column] === 0) continue; // Пропускаем если в ячейке матрицы фигуры встречается 0,
                if(this.#currentFigure.ghostRow + row < 0) continue; // Пропускаем если фигура за игровым полем (выше), пропускаем
                let cellIndex = this.#getIndexFromPosition(
                    this.#currentFigure.ghostRow + row,
                    this.#currentFigure.ghostColumn + column
                );
                this.#playGridCells[cellIndex].classList.add('ghost');
            }
        }
    }
    // Получить индекс div элемента от позиции в матрице
    #getIndexFromPosition(row, column) {
        return column + (row * this.#playGridColumns);
    }

    #startLoop() {
        this.#timerId = setTimeout(() => {
            this.#requestId = requestAnimationFrame(() => this.#moveFigureDown());
        }, 700);
    }
    #stopLoop() {
        cancelAnimationFrame(this.#requestId);
        clearTimeout(this.#timerId);
    }
    // Перемещение фигур
    #moveFigureDown() {
        this.#currentFigure.currentRow += 1;
        if(!this.#isValid()) {
            this.#currentFigure.currentRow -= 1;
            this.#placeFigure(); // Сохраняем место фигуры в матрицу
        }
        this.#render();

        this.#stopLoop(); // Останавливаем цикл, чтобы не было двойных рывков фигуры вниз
        this.#startLoop();

        if(this.#isGameOver) {
            this.#gameOver();
        }
    }
    #moveFigureLeft() {
        this.#currentFigure.currentColumn -= 1;
        if(!this.#isValid()) {
            this.#currentFigure.currentColumn += 1;
        } else {
            this.#calculateGhostPosition();
        }
        this.#render();
    }
    #moveFigureRight() {
        this.#currentFigure.currentColumn += 1;
        if(!this.#isValid()) {
            this.#currentFigure.currentColumn -= 1;
        } else {
            this.#calculateGhostPosition();
        }
        this.#render();
    }
    #rotateFigure() {
        let oldMatrix = this.#currentFigure.matrix;
        this.#currentFigure.matrix = this.#rotateMatrix(this.#currentFigure.matrix);
        if(!this.#isValid()) {
            this.#currentFigure.matrix = oldMatrix;
        } else {
            this.#calculateGhostPosition();
        }
        this.#render();
    }
    // Поворот матрицы фигуры
    #rotateMatrix(matrix) {
        /* Пример поворота на 90 градусов, фигура L, представим поворот стороны кубик рубика
            [0, 0, 1]       [0, 1, 0]
            [1, 1, 1]  -->  [0, 1, 0]
            [0, 0, 0]       [0, 1, 1]
        */
        let L = matrix.length; // L - длина стороны матрицы, матрица у нас всегда квадрат
        let rotatedMatrix = [];
        for (let i = 0; i < L; i++) {
            rotatedMatrix[i] = [];
            for (let j = 0; j < L; j++) {
                rotatedMatrix[i][j] = matrix[L - j - 1][i];
            }
        }
        return rotatedMatrix;
    }
    #dropFigureDown() {
        this.#currentFigure.currentRow = this.#currentFigure.ghostRow; // Устанавливаем строку на позицию призрачной фигуры
        this.#placeFigure();

        this.#render();

        this.#stopLoop(); // Останавливаем цикл, чтобы не было двойных рывков фигуры вниз
        this.#startLoop();

        if(this.#isGameOver) {
            this.#gameOver();
        }
    }

    // Проверка на корректность
    #isValid() {
        let figureMatrixMaxSize = this.#currentFigure.matrix.length;
        for (let row = 0; row < figureMatrixMaxSize; row++) { // Перебираем матрицу фигуры по строкам и колонкам
            for (let column = 0; column < figureMatrixMaxSize; column++) {
                if(this.#currentFigure.matrix[row][column] === 0) continue; // Пропускаем если в ячейке матрицы фигуры встречается 0,
                if(this.#checkOutsidePlayGrid(row, column)) return false; // Не валид, если фигура за игровым полем
                if(this.#checkCellForFigure(row, column)) return false; // Проверка ячейки на присутствие в нем фигуры, чтобы не наехать на нее
            }
        }
        return true;
    }
    // Проверка на выход границ игрового поля
    #checkOutsidePlayGrid(row, column) {
        return this.#currentFigure.currentColumn + column < 0 || // Граница левой части
            this.#currentFigure.currentColumn + column >= this.#playGridColumns || // Граница Правой части
            this.#currentFigure.currentRow + row >= this.#playGridRows; // Граница нижней части
    }
    #checkOutsidePlayGridTopBorder(row) {
        return this.#currentFigure.currentRow + row < 0; // Граница нижней части
    }
    // Проверка ячейки на присутствие в нем фигуры, чтобы не наехать на нее
    #checkCellForFigure(row, column) {
        /* Если в матрице в конкретной ячейке что-то есть,
         то мы вернем строку (название буквы элемента, например T),
         который преобразуется в true, а если возвращаем true, то мы делаем не валид,
         если в пустой ячейке будет 0, что преобразуется в false, значит эту ячейку можно заполнить */
        return this.#playGridMatrix[this.#currentFigure.currentRow + row]?.[this.#currentFigure.currentColumn + column];
    }

    // Поставить фигуру, записав в матрицу
    #placeFigure() {
        let figureMaxSize = this.#currentFigure.matrix.length;
        for (let row = 0; row < figureMaxSize; row++) { // Перебираем матрицу фигуры по строкам и колонкам
            for (let column = 0; column < figureMaxSize; column++) {
                if(this.#currentFigure.matrix[row][column] === 0) continue; // Пропускаем если в ячейке матрицы фигуры встречается 0,
                if(this.#checkOutsidePlayGridTopBorder(row)) { // Проверка выхода фигуры за верхнюю границу
                    this.#isGameOver = true;
                    return;
                }

                this.#playGridMatrix[this.#currentFigure.currentRow + row][this.#currentFigure.currentColumn + column] = this.#currentFigure.name;
            }
        }

        this.#processFilledRows();
        this.#createFigureMain();
        this.#playPlaceFigureSound();
    }
    // Обработка заполненных полей
    #processFilledRows() {
        let filledLines = this.#findFilledRows();

        this.#removeFilledRows(filledLines);
        this.#addGamePoints(filledLines);
    }
    // Поиск заполненных полей
    #findFilledRows() {
        let filledRows = [];
        for (let row = 0; row < this.#playGridRows; row++) {
            // Проходимся по каждой строке матрицы и проверяем есть ли что-то кроме 0 в каждой ячейке строки
            if( this.#playGridMatrix[row].every(cell => Boolean(cell)) ) {
                filledRows.push(row);
            }
        }
        return filledRows;
    }
    // Удаление заполненных полей
    #removeFilledRows(filledRows) {
        filledRows.forEach(rowToDelete => {
            for (let row = rowToDelete; row > 0; row--) {
                this.#playGridMatrix[row] = this.#playGridMatrix[row - 1]; // Перезаписываем все поля вниз
            }
            this.#playGridMatrix[0] = new Array(this.#playGridColumns).fill(0); // Заполняем первую строку 0ми
        });
    }

    #gameOver(){
        this.#hidePauseButton();
        this.#stopLoop();
        this.#unInitKeydown();
        this.#stopGameSound();
        this.#GameOverSound();
        alert('игра закончена');
    }

    // Расчет призрачной фигуры
    #calculateGhostPosition() {
        /* Опускаем фигуру, до валидной строки, записываем её в призрачную строку,
         затем возвращаем оригинальную строку обратно*/
        let figureRow = this.#currentFigure.currentRow;
        this.#currentFigure.currentRow++;
        while (this.#isValid()) {
            this.#currentFigure.currentRow++;
        }
        this.#currentFigure.ghostRow = this.#currentFigure.currentRow - 1;
        this.#currentFigure.ghostColumn = this.#currentFigure.currentColumn;

        this.#currentFigure.currentRow = figureRow;
    }

    // Создание кнопок управления тетрисом DOM
    #createControlButtons() {
        let controlWrap = document.createElement('div');
        controlWrap.classList.add('tetris__controls');
        controlWrap.append(this.#createButton('tetris__start', 'Старт', this.#startButtonHandler));
        controlWrap.append(this.#createButton('tetris__pause', 'Пауза', this.#pauseButtonHandler));

        this.#tetrisHTML.append(controlWrap);
    }
    #createButton(elClass, text, func) {
        const button = document.createElement('button');
        button.className = elClass;
        button.textContent = text;
        button.addEventListener('click', func.bind(this));

        return button;
    }
    #hidePauseButton() {
        const buttonPause = this.#tetrisHTML.querySelector('.tetris__pause');
        buttonPause.style.display = 'none';
    }
    #startButtonHandler() {
        this.play();
        const buttonStart = this.#tetrisHTML.querySelector('.tetris__start');
        const buttonPause = this.#tetrisHTML.querySelector('.tetris__pause');
        buttonStart.style.display = 'none';
        buttonPause.style.display = 'block';

    }
    #pauseButtonHandler() {
        const buttonPause = this.#tetrisHTML.querySelector('.tetris__pause');
        buttonPause.blur();
        if(this.#isGamePause) {
            // Продолжаем игру
            this.#startLoop();
            this.#playGameSound();
            this.#isGamePause = false;
            buttonPause.textContent = 'Пауза';
        } else {
            // Ставим паузу
            this.#stopLoop();
            this.#stopGameSound();
            this.#isGamePause = true;
            buttonPause.textContent = 'Продолжить';
        }
    }

    // Создание следующей фигуры DOM
    #createNextFigureHTML(){
        const nextFigureWrap = document.createElement('div'),
            nextFigureLabel = document.createElement('div');
        this.#nextFigureDOM = document.createElement('div');

        nextFigureWrap.classList.add('tetris__next-figure-wrap');
        this.#nextFigureDOM.classList.add('tetris__next-figure');
        nextFigureLabel.textContent = 'Следующая фигура';

        const cellsList = new DocumentFragment();
        for (let cell = 0; cell < 9; cell++) {
            const cell = document.createElement('div');
            cellsList.append(cell);
        }
        this.#nextFigureDOM.append(cellsList);

        nextFigureWrap.append(nextFigureLabel);
        nextFigureWrap.append(this.#nextFigureDOM);
        this.#tetrisHTML.append(nextFigureWrap);
    }
    // Рендер следующей фигуры
    #renderNextFigure() {
        this.#nextFigureDOM.style.gridTemplateColumns = 'repeat(' + this.#nextFigure.matrix.length + ', 20px)';

        const cellsList = new DocumentFragment();
        for (let row = 0; row < this.#nextFigure.matrix.length; row++) {
            for (let column = 0; column < this.#nextFigure.matrix.length; column++) {
                const cell = document.createElement('div');
                if( this.#nextFigure.matrix[row][column] !== 0 ) cell.classList.add( this.#nextFigure.name );
                cellsList.append(cell);
            }
        }

        this.#nextFigureDOM.replaceChildren(cellsList); // Заменяем внутренние элементы
    }

    // Добавление игровых очков, если есть заполненные линии
    #addGamePoints(filledLines) {
        if(filledLines.length <= 0) return;

        this.#gamePoints += filledLines.length
        const gamePointsDOM = this.#tetrisHTML.querySelector('.tetris__points-value');
        gamePointsDOM.textContent = this.#gamePoints;
    }

    #playPlaceFigureSound() {
        this.#soundPlaceFigure.currentTime = 0;
        this.#soundPlaceFigure.play();
    }
    #playGameSound() {
        this.#soundGame.loop = true;
        this.#soundGame.currentTime = 0;
        this.#soundGame.play();
    }
    #stopGameSound() {
        this.#soundGame.pause();
        this.#soundGame.currentTime = 0;
    }
    #GameOverSound() {
        this.#soundGameOver.currentTime = 0;
        this.#soundGameOver.play();
    }
}