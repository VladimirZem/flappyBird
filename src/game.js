class Game {
  STATES = {               // Стадии
    LOADING: 'LOADING',     // Загрузка
    IDLE: 'IDLE',           // Главное меню
    PLAYING: 'PLAYING',     // Игровой процесс
    GAME_OVER: 'GAME_OVER', // Игра окончена
  }

  constructor() {
    this._config = new Config()       
    this._storage = new LocalStorage()

    this._lastUpdate = null
    this._currentState = this.STATES.LOADING
    this._backgrounds = []

    this._configureResources()
    this._configureCanvas()
    this._configureDrawEngine()
    this._configureInputEngines()
    this._addEventListeners()
   
  }

  _addEventListeners() {
    window.addEventListener('resize', debounce(this._resize.bind(this)))
    
    this._inputEngines.forEach(handler => handler.subscribe())
  }

  _resize() {
    const width = this._canvas.clientWidth
    const height = this._canvas.clientHeight

    this._canvas.width = width
    this._canvas.height = height

    this._scene.resize(width, height)       // Ресуем игровую зону
    this._drawEngine.resize(width, height)  // Рисует движок
    this._generateBackgrounds()           // Генирируем задний фон
    this._changeState(this._currentState)   // Меняем стадии
  }

  _configureResources() {
    const resourceLoader = new ResourceLoader()    
    this._resources = new ResourceStorage({ loader: resourceLoader }) // Передаем знаечние в загрузчик
  }

  _configureCollisionEngine() {
    this._collisionEngine = new RectCollisionEngine()  // Движок с колиззией
  }

  _configurePhysicsEngine() {
    this._physicsEngine = new PhysicsEngine({ gravitation: this._config.gravitation })  // Физ движок для гравитации
  }

  _configureCanvas() {
    this._canvas = document.getElementById(this._config.canvas.id)   // Получаем канвас из html
  }

  _configureDrawEngine() {
    this._drawEngine = new CanvasDrawEngine({ canvas: this._canvas })  // Отрисовываем канвас
  }

  _configureScene() {
    this._scene = new Scene({         // В игровую сцену передаем знаечние
      game: this,                     // Игра
      drawEngine: this._drawEngine,     // Движок, который все рисует
      collisionEngine: this._collisionEngine, // Движок с границами
      width: this._config.canvas.width,  // Ширина канваса
      height: this._config.canvas.height,  // Высота канваса
    })
  }

  _createEntities() {                    // Создаем сущности
    this._backgrounds = []              // Пустой массив для заднего фона
    this._generateBackgrounds()         // Функиця генирации заднего фона

    this._tubesDriver = new TubesDriver({  // Передаем значение наших труб
      game: this, 
      scene: this._scene,
      drawEngine: this._drawEngine,
      spriteSheet: this._resources.get('spriteSheet'),  // Получаем спрайт нашей трубы
      tubePattern: this._resources.get('tubePattern'),  // Получеам саму трубу
      frames: this._config.resources.entries.tube,  // Фреймы для труб
      speed: this._config.tubes.speed,  // Скорость
      width: this._config.tubes.width,  //Ширина
      borderOffset: this._config.tubes.borderOffset,  //Устанавлиаем границы
      spaceMin: this._config.tubes.spaceMin,  // Минимальное пространство в трубе 
      spaceMax: this._config.tubes.spaceMax, // Максимальное пространство в трубеи
      minDistance: this._config.tubes.minDistance, //Минимальное расстояние между ними 
      maxDistance: this._config.tubes.maxDistance, //Максимальное расстояние между ними 
    })

    this._bird = new Bird({        // ПТЫЧКА
      x: this._config.bird.startX,  // Позиция по иксу при старте игры
      y: this._scene.height / 2 - this._config.bird.height / 2,  //Позиция по у при старте игры 
      width: this._config.bird.width, // Ширины птички
      height: this._config.bird.height,  // Высота птички
      flapSpeed: this._config.bird.flapSpeed,  // Скорость взлета
      rotationSpeed: this._config.bird.rotationSpeed,  // Скорость взмаха
      animationSpeed: this._config.bird.animationSpeed, // Анимация птички скорость
      frames: this._config.resources.entries.bird,  // Получаем фреймы
      spriteSheet: this._resources.get('spriteSheet'), // Получаем птичку из спрайта
      flapSound: this._resources.get('flapSound'),  // Получеам звук взмаха
      hitSound: this._resources.get('hitSound'),  // Звук удара птчки
      dieSound: this._resources.get('dieSound'), // Звук смерти птичик
      drawEngine: this._drawEngine,  // рисуем
      scene: this._scene,  // передаем значение в сцену
      physicsEngine: this._physicsEngine,  // в физ двиг
      game: this,
    })
  }

  _generateBackgrounds() {          // генирируем задний фон
    this._backgrounds.forEach(background => background.delete())  // Циклом удалаеи не нужное уже

    const backgroundAspectRatio = this._config.background.width / this._config.background.height // Делаем движение фона
    let lastBackground = null                                                             ///
    while (!lastBackground || lastBackground.initialX < this._scene.width) {        ///////
      let x = 0              ////
      if (lastBackground) {      ///////
        x = lastBackground.x + lastBackground.width     ////////
      }

      const background = new Background({
        x,
        y: 0,
        width: this._scene.height * backgroundAspectRatio,
        height: this._scene.height,
        speed: this._config.background.speed,
        frames: this._config.resources.entries.background,
        spriteSheet: this._resources.get('spriteSheet'),
        drawEngine: this._drawEngine,
        scene: this._scene,
        game: this,
      })
      this._backgrounds.push(background)

      lastBackground = this._backgrounds[this._backgrounds.length - 1]
    }
  }

  _configureInputEngines() {   ////// Дальше управление ничего интересного
    const keyHandlersMap = {
      [this._config.actionKey]: () => {
        this._handleAction()
      },
    }
    const keyboard = new KeyboardInputEngine({
      element: this._canvas,
      keyHandlersMap,
    })

    const clickHandlers = {
      left: () => {
        this._handleAction()
      }
    }
    const mouse = new MouseInputEngine({
      element: document,
      clickHandlers,
    })

    const buttonHandlersMap = {
      [this._config.actionButton]: () => {
        this._handleAction()
      },
    }
    const gamepad = new GamepadInputEngine({
      element: document,
      buttonHandlersMap
    })

    this._inputEngines = [keyboard, mouse, gamepad]
  }

  _handleAction() {          /// ШО ДЕЛАТЬ ПРИ ТОЙ ИЛИ ИНОЙ сцене
    const actionByStateMap = {
      [this.STATES.LOADING]: () => {},

      [this.STATES.IDLE]: () => {
        this.start()
      },

      [this.STATES.PLAYING]: () => {
        this._bird.flap()
      },

      [this.STATES.GAME_OVER]: () => {
        this.start()
      },
    }

    const action = actionByStateMap[this._currentState]
    return action()
  }

  _changeState(state) {     // Меняем сцены при том или иной обстоятельстве 
    this._drawEngine.clear()
    this._currentState = state

    const stateChangeHandlersMap = {
      [this.STATES.PLAYING]: () => {
        this._loop()
      },

      [this.STATES.LOADING]: () => {
        new CenteredTextComponent({ text: this._config.texts.loading }).draw(this._drawEngine)
      },

      [this.STATES.IDLE]: () => {
        new WithScoresComponent({
          text: this._config.texts.idle,
          score: this._score,
          highScore: this._highScore,
        }).draw(this._drawEngine)
      },

      [this.STATES.GAME_OVER]: () => {
        new WithScoresComponent({
          text: this._config.texts.gameOver,
          score: this._score,
          highScore: this._highScore,
        }).draw(this._drawEngine)
      }
    }

    const handler = stateChangeHandlersMap[state]
    handler()
  }

  reset() {                          /// Сброс 
    this._changeState(this.STATES.IDLE)
    this._score = 0
    this._level = 0
    this._configurePhysicsEngine()
    this._configureCollisionEngine()
    this._configureScene()
    this._resize()
    this._createEntities()
  }

  gameOver() {                               // Птичка труп
    this._changeState(this.STATES.GAME_OVER)
  }

  async prepare() {                          /// предварительная загрузка
    this._highScore = parseInt(this._storage.load('highScore'), 10) || 0

    this._changeState(this.STATES.LOADING)

    const imageCutter = new ImageCutter()
    await this._resources.load({
      spriteSheet: {
        type: RESOURCE_TYPE.IMAGE,
        src: this._config.resources.spriteSheet.src,
        width: this._config.resources.spriteSheet.width,
        height: this._config.resources.spriteSheet.height,
      },

      dieSound: {
        type: RESOURCE_TYPE.AUDIO,
        src: 'assets/audio/die.wav',
      },
      flapSound: {
        type: RESOURCE_TYPE.AUDIO,
        src: 'assets/audio/flap.wav',
      },
      hitSound: {
        type: RESOURCE_TYPE.AUDIO,
        src: 'assets/audio/hit.wav',
      },
      pointSound: {
        type: RESOURCE_TYPE.AUDIO,
        src: 'assets/audio/point.wav',
      },
      swooshingSound: {
        type: RESOURCE_TYPE.AUDIO,
        src: 'assets/audio/swooshing.wav',
      },
    })
    const spriteSheet = this._resources.get('spriteSheet')
    await this._resources.load({
      tubePattern: {
        type: RESOURCE_TYPE.IMAGE,
        src: await imageCutter.getImagePartSrc({
          spriteSheet,
          width: this._config.resources.tubePattern.w,
          height: this._config.resources.tubePattern.h,
          image: {
            x: this._config.resources.tubePattern.x,
            y: this._config.resources.tubePattern.y,
            w: this._config.resources.tubePattern.w,
            h: this._config.resources.tubePattern.h,
          },
        }),
      },
    })

    this.reset()
  }

  _updateScore(delta) {    // Обновление очков
    const birdCenter = this._bird.x + this._bird.width / 2
    const crossingTube = this._tubesDriver.getTubes({ from: birdCenter, to: birdCenter })[0]
    if (!crossingTube) {
      return
    }

    const tubeCenter = crossingTube.x + crossingTube.width / 2
    const threshold = (this._config.tubes.speed + this._config.levelUpAcceleration * this._level) * delta
    if (tubeCenter + threshold / 2 >= birdCenter && tubeCenter - threshold / 2 <= birdCenter) {
      this._score++

      const pointSound = this._resources.get('pointSound')
      pointSound.play()

      if (this._score >= 10 * (this._level + 1)) {
        this._increaseLevel()
      }
    }
  }

  _update(delta) {
    this._tubesDriver.update()
    this._scene.update(delta)

    this._updateScore(delta)

    if (this._score > this._highScore) {
      this._highScore = this._score
      this._storage.save('highScore', this._highScore)
    }
  }

  _increaseLevel() {
    this._level += 1
    this._scene.getEntities().filter((entity) => {
      return entity instanceof Tube || entity instanceof Background
    }).forEach((entity) => {
      entity.speed += this._config.levelUpAcceleration
    })
    this._tubesDriver.increaseSpeed(this._config.levelUpAcceleration)
  }

  _draw() { // Отрисовка очков уровня сцены и тд
    this._drawEngine.clear()
    this._scene.draw()
    new TextComponent({
      text: `Score: ${this._score}`,
      x: this._config.scoreLabel.x,
      y: this._config.scoreLabel.y,
      textAlign: 'left',
    }).draw(this._drawEngine)
  }

  _loop() {  // Игровой цикл
    const now = Date.now()
    const delta = (now - this._lastUpdate) / 1000.0

    this._update(delta)

    if (this._currentState === this.STATES.PLAYING) {
      this._draw()
      this._lastUpdate = now

      requestAnimationFrame(debounce(this._loop.bind(this), 1000 / this._config.fps))
    }
  }

  start() {  // Старт
    this.reset()

    const swooshingSound = this._resources.get('swooshingSound')
    swooshingSound.play()

    this._lastUpdate = Date.now()
    this._changeState(this.STATES.PLAYING)
  }
}
