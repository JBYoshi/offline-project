/**
 * @param {Function} callback
 * @returns {Function}
 */
function checking(callback) {
    return function() {
        try {
            return callback.apply(this, arguments);
        } catch (e) {
            var text;
            if (e.stack) {
                if (e.stack.startsWith && e.stack.startsWith('' + e)) {
                    text = e.stack;
                } else {
                    text = textarea.value = e + '\n' + e.stack;
                }
            } else {
                text = e + '';
            }
            setError(text);
            window.theError = e
            console.log('Error thrown, stored as window.theError')
            throw e;
        }
    }
}

/**
 * @typedef {object} Point
 * @property {Number} x 
 * @property {Number} y 
 */

/**
 * @param {Point} p
 * @returns {Number} 
 */
function browserX(p) {
    return (p.x + 0.5) / board.width * backBuffer.width
}

/**
 * @param {Point} p
 * @returns {Number} 
 */
function browserY(p) {
    return (p.y + 0.5) / board.height * backBuffer.height
}

/**
 * @param {Point} point
 * @param {Number} profit
 */
function Computer(point, profit) {
    /**
     * @property {Point}
     */
    this.point = point
    /**
     * @property {Boolean}
     */
    this.powered = false

    /**
     * @property {Number}
     */
    this.profit = profit
}

function Board() {
    this.width = 30
    this.height = 20
    let cityRadius = 2
    let cityCount = 3
    const cityDensity = 0.8

    this.money = 20

    this.enabled = true

    /**
     * @type {[[Computer]]}
     */
    this.computersByPosition = new Array(this.width);
    for (var x = 0; x < this.width; x++) {
        this.computersByPosition[x] = new Array(this.height);
    }
    for (var i = 0; i < cityCount; i++) {
        var cityX = Math.floor(Math.random() * this.width)
        var cityY = Math.floor(Math.random() * this.height)
        var computersInCity = []
        for (var x = cityX - cityRadius; x <= cityX + cityRadius; x++) {
            if (x < 0 || x >= this.width) continue
            for (var y = cityY - cityRadius; y <= cityY + cityRadius; y++) {
                if (y <= 0 || y >= this.height) continue
                if ((x == cityX && y == cityY || Math.random() < cityDensity) && !this.computersByPosition[x][y]) {
                    let cost = Math.random() * 10
                    if (cost > 6) cost = Math.random() * 10
                    this.computersByPosition[x][y] = new Computer({x: x, y: y}, Math.floor(cost))
                    computersInCity.push(this.computersByPosition[x][y])
                }
            }
        }
        if (i == 0) {
            let index = Math.floor(Math.random() * computersInCity.length)
            computersInCity[index].powered = true
        }
    }
    for (var i = 0; i < this.width * this.height / 25; i++) {
        var x = Math.floor(Math.random() * this.width)
        var y = Math.floor(Math.random() * (this.height - 1)) + 1
        if (!this.computersByPosition[x][y]) {
            this.computersByPosition[x][y] = new Computer({x: x, y: y}, Math.floor(Math.random() * 3))
        }
    }
    /**
     * @type {[Computer]}
     */
    this.computers = []
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            if (this.computersByPosition[x][y]) {
                this.computers.push(this.computersByPosition[x][y])
            }
        }
    }

    /**
     * @type {[{a: Point, b: Point}]}
     */
    this.connections = []
}

/**
 * @type {Board}
 */
let board

/**
 * @type {Point}
 */
let newConnStart = null,
    newConnEnd = null

/**
 * @type {HTMLCanvasElement}
 */
let frontBuffer
/**
 * @type {HTMLCanvasElement}
 */
let backBuffer

function distance(p1, p2) {
    let dx = p2.x - p1.x
    let dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
}

/**
 * @param {Point} p1
 * @param {Point} p2
 * @returns {Number}
 */
function getCost(p1, p2) {
    return Math.ceil(distance(p1, p2)) + 3
}

function repaint() {
    if (!board) {
        frontBuffer.getContext('2d').clearRect(0, 0, frontBuffer.width, frontBuffer.height)
        backBuffer.getContext('2d').clearRect(0, 0, backBuffer.width, backBuffer.height)
        return
    }

    let w = document.body.clientWidth
    let h = document.body.clientHeight
    if (w / board.width > h / board.height) {
        w = Math.floor(h / board.height * board.width)
    } else {
        h = Math.floor(w / board.width * board.height)
    }
    backBuffer.width = w
    backBuffer.height = h
    //backBuffer.style.width = w + 'px'
    //backBuffer.style.height = h + 'px'

    let ctx = backBuffer.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    if (board) {
        let halfUnit = w / board.width / 2
        let textSize = halfUnit * 4 / 3 // TODO optimize
        ctx.font = textSize + 'px monospace'

        for (var conn of board.connections) {
            ctx.beginPath()
            ctx.moveTo(browserX(conn.a), browserY(conn.a))
            ctx.lineTo(browserX(conn.b), browserY(conn.b))
            ctx.lineWidth = halfUnit
            ctx.strokeStyle = 'yellow'
            ctx.stroke()
        }
        if (newConnStart && newConnEnd) {
            ctx.beginPath()
            ctx.moveTo(browserX(newConnStart), browserY(newConnStart))
            ctx.lineTo(browserX(newConnEnd), browserY(newConnEnd))
            ctx.lineWidth = halfUnit
            ctx.strokeStyle = getCost(newConnStart, newConnEnd) <= board.money ? 'yellow' : 'lightsteelblue'
            ctx.stroke()
        }
        for (var comp of board.computers) {
            // TODO do something that looks more like a computer
            ctx.beginPath()
            ctx.arc(browserX(comp.point), browserY(comp.point), halfUnit, 0, 2 * Math.PI, false)
            if (comp.powered) {
                ctx.fillStyle = 'lime'
            } else {
                ctx.fillStyle = 'lightsteelblue'
            }
            ctx.fill()
            if (comp.powered) {
                ctx.fillStyle = 'green'
            } else {
                ctx.fillStyle = 'darkslateblue'
            }
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('' + comp.profit, browserX(comp.point), browserY(comp.point), textSize)
        }
        ctx.fillStyle = board.money <= 0 ? 'red' : 'white'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'top'
        let scoreText
        if (board.money < 0) {
            scoreText = 'Money: IN DEBT by $' + -board.money + ' million'
        } else {
            scoreText = 'Money: $' + board.money + ' million'
        }
        ctx.fillText(scoreText, w - 1, 0)
        if (newConnStart && newConnEnd) {
            ctx.fillStyle = 'red'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            let textPos = {x: newConnEnd.x, y: newConnEnd.y - 1}
            ctx.fillText('-$' + getCost(newConnStart, newConnEnd) + 'M', browserX(textPos), browserY(textPos))
        }
    }

    frontBuffer.style.display = 'none'
    backBuffer.style.display = 'block'

    let temp = frontBuffer
    frontBuffer = backBuffer
    backBuffer = temp
}
window.addEventListener('resize', checking(repaint))
window.addEventListener('load', checking(function () {
    frontBuffer = document.getElementById('c1')
    frontBuffer.style.display = 'none'
    backBuffer = document.getElementById('c2')
    backBuffer.style.display = 'none'

    /**
     * @param {MouseEvent} e
     * @param {Boolean} forceValid
     * @returns {Point}
     */
    function eventToGameCoords(e, forceValid) {
        let canvasBounds = frontBuffer.getBoundingClientRect();
        let canvasX = e.clientX - canvasBounds.x;
        let canvasY = e.clientY - canvasBounds.y;
        let gameX = Math.round((canvasX / frontBuffer.offsetWidth * board.width) - 0.5)
        let gameY = Math.round((canvasY / frontBuffer.offsetHeight * board.height) - 0.5)
        if (gameX < 0) {
            if (forceValid) return null
            gameX = 0
        } else if (gameX >= board.width) {
            if (forceValid) return null
            gameX = board.width - 1
        }
        if (gameY < 0) {
            if (forceValid) return null
            gameY = 0
        } else if (gameY >= board.height) {
            if (forceValid) return null
            gameY = board.height - 1
        }
        return {
            x: gameX,
            y: gameY
        }
    }

    if (window.location.protocol === 'file:' || window.location.host === 'localhost') {
        document.getElementById('download').style.display = 'none'
    }

    let aboutDiv = document.getElementById('about')
    let overlayDiv = document.getElementById('in-game-overlay')
    let bankruptDiv = document.getElementById('bankrupt')
    let noMovesDiv = document.getElementById('no-moves')
    let winDiv = document.getElementById('win')

    document.body.addEventListener('mousedown', checking(function (e) {
        if (!board || !board.enabled) return
        let point = eventToGameCoords(e, true)
        if (point && board.computersByPosition[point.x][point.y] && board.computersByPosition[point.x][point.y].powered) {
            newConnStart = point
            newConnEnd = eventToGameCoords(e, true)
            repaint()
        }
    }))
    document.body.addEventListener('mousemove', checking(function (e) {
        if (!board || !board.enabled) return
        if (newConnStart) {
            newConnEnd = eventToGameCoords(e, false)
            repaint()
        }
    }))
    function endGame(endDiv) {
        let numConnected = 0
        for (var comp of board.computers) {
            if (comp.powered) numConnected++
        }
        if (numConnected < board.computers.length / 2) {
            numConnected = Math.ceil(numConnected / board.computers.length * 100)
        } else {
            numConnected = Math.floor(numConnected / board.computers.length * 100)
        }
        var scorePlaceholders = document.getElementsByClassName('score-end');
        for (var x = 0; x < scorePlaceholders.length; x++) {
            scorePlaceholders[x].innerText = numConnected
        }
        overlayDiv.style.display = 'none'
        endDiv.style.display = 'block'
        board.enabled = false
    }
    document.body.addEventListener('mouseup', checking(function (e) {
        if (!board || !board.enabled) return
        if (newConnStart && newConnEnd && board.computersByPosition[newConnEnd.x][newConnEnd.y]
                    && !board.computersByPosition[newConnEnd.x][newConnEnd.y].powered
                    && (newConnStart.x != newConnEnd.x || newConnStart.y != newConnEnd.y)) {
            let cost = getCost(newConnStart, newConnEnd)
            let dest = board.computersByPosition[newConnEnd.x][newConnEnd.y]
            if (board.money >= cost) {
                board.money -= cost
                if (!dest.powered) {
                    board.money += dest.profit
                    dest.powered = true
                }
                board.connections.push({
                    a: newConnStart,
                    b: newConnEnd
                })
                if (board.money <= 0) {
                    endGame(bankruptDiv)
                } else {
                    var movesAvailable = false
                    var computersAvailable = false
                    findMoves: for (var c1 of board.computers) {
                        if (!c1.powered) {
                            computersAvailable = true
                            continue;
                        }
                        for (var c2 of board.computers) {
                            if (c2.powered) continue;
                            computersAvailable = true
                            if (getCost(c1.point, c2.point) <= board.money) {
                                movesAvailable = true
                                break findMoves
                            }
                        }
                    }
                    if (!computersAvailable) {
                        endGame(winDiv)
                    }
                    if (!movesAvailable) {
                        endGame(noMovesDiv)
                    }
                }
            }
        }
        newConnStart = null
        newConnEnd = null
        repaint()
    }))

    function start() {
        board = new Board()
        aboutDiv.style.display = 'none'
        bankruptDiv.style.display = 'none'
        winDiv.style.display = 'none'
        noMovesDiv.style.display = 'none'
        overlayDiv.style.display = 'block'
        repaint()
    }
    function clear() {
        board = null
        newConnStart = null
        newConnEnd = null
        aboutDiv.style.display = 'block'
        bankruptDiv.style.display = 'none'
        winDiv.style.display = 'none'
        noMovesDiv.style.display = 'none'
        overlayDiv.style.display = 'none'
        frontBuffer.style.display = 'none'
        backBuffer.style.display = 'none'
        repaint()
    }
    var startButtons = document.getElementsByClassName('start');
    for (var x = 0; x < startButtons.length; x++) {
        startButtons[x].addEventListener('click', checking(start))
    }
    var clearButtons = document.getElementsByClassName('quit');
    for (var x = 0; x < clearButtons.length; x++) {
        clearButtons[x].addEventListener('click', checking(clear))
    }
    clear()
    document.getElementById('loading').style.display = 'none'
}))

window.scriptReady = true