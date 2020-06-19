;(function () {
	const gamePanel = document.getElementById('panel')
	const resetBtn = document.getElementById('resetBtn')
	const step = document.getElementById('step')
	// 方块宽度 边距 外左边距 上外边距 c*c面板
	const w = 60,
		m = 8,
		l = 8,
		t = 9,
		c = 4
	const blockNum = c * c
	// 方块所有位置
	let positions = []
	// 方块存放
	let blocks = Array(blockNum).fill(0)
	// 滑动左距离 滑动上距离
	let moveStartLeft, moveStartTop, moveEndLeft, moveEndTop

	// 游戏初始化
	function init() {
		// 生成位置信息
		for (let i = 0; i < blockNum; i++) {
			positions[i] = {
				top: t + Math.floor(i / c) * (w + m),
				left: l + (i % c) * (w + m),
			}
		}
		// 生成2个方块
		createBlock2Or4(2)
		// 绑定事件
		resetBtn.onclick = reset
		bindTouchEvent()
	}

	// 生成m个方块2或者4
	function createBlock2Or4(m = 1) {
		while (m-- > 0) {
			createBlock(Math.random() > 0.5 ? 4 : 2)
		}
	}

	// 随机位置创建方块
	function createBlock(num) {
		let r
		do {
			r = Math.floor(Math.random() * blockNum)
		} while (blocks[r] !== 0)
		blocks[r] = num
		let b = document.createElement('div')
		b.id = `block-${r}`
		b.className = `block block-${num}`
		b.innerText = num
		b.style.top = positions[r].top + 'px'
		b.style.left = positions[r].left + 'px'
		gamePanel.appendChild(b)
	}

	// 绑定滑动事件
	function bindTouchEvent() {
		gamePanel.addEventListener(
			'touchstart',
			(e) => {
				moveStartLeft = e.targetTouches[0].pageX
				moveStartTop = e.targetTouches[0].pageY
			},
			false
		)
		gamePanel.addEventListener(
			'touchmove',
			(e) => {
				if (e.targetTouches.length > 1 || (e.scale && e.scale !== 1)) {
					return
				}
				moveEndLeft = e.targetTouches[0].pageX
				moveEndTop = e.targetTouches[0].pageY
			},
			false
		)
		gamePanel.addEventListener(
			'touchend',
			() => {
				if (!moveEndLeft || !moveEndTop) {
					return
				}
				// 判断滑动方向
				let rowD = Math.abs(moveStartLeft - moveEndLeft)
				let colD = Math.abs(moveStartTop - moveEndTop)
				if (rowD === colD || Math.max(rowD, colD) < 100) {
					return
				}
				let isUpOrDown = rowD < colD
				let direction = isUpOrDown
					? moveStartTop < moveEndTop
						? 'down'
						: 'top'
					: moveStartLeft < moveEndLeft
					? 'right'
					: 'left'
				// 合并
				let canMerge = checkMergeBlocks(direction)
				// 移动
				let canMove = checkMoveBlocks(direction)
				// 无合并项且不能移动就返回
				if (!canMerge && !canMove) {
					return
				}
				// 加步数
				step.innerText = parseInt(step.innerText) + 1
				// 先更新视图
				setTimeout(() => {
					// 显示步数
					if (blocks.includes(2048)) {
						alert(`划了${step.innerText}下终于赢了，好累啊~`)
						reset()
						return
					}
					// 生成1个方块2或者4
					createBlock2Or4()
					setTimeout(() => {
						// 全部满格且没有相同的相邻格子
						if (!blocks.includes(0)) {
							for (let i = 0; i < blocks.length; i++) {
								if (
									blocks[i] === blocks[i + 1] ||
									blocks[i] === blocks[i - 1] ||
									blocks[i] === blocks[i + c] ||
									blocks[i] === blocks[i - c]
								) {
									return
								}
							}
							alert('game over')
							reset()
						}
					}, 100)
				}, 100)
			},
			false
		)
	}

	// 检查合并
	function checkMergeBlocks(direction) {
		let canMerge = false
		// 检查每一列/行
		for (let i = 0; i < c; i++) {
			let richBlocks = blocks.map((value, index) => {
				return {
					value,
					index,
				}
			})
			let currCol
			if (direction === 'top' || direction === 'down') {
				currCol = richBlocks.filter((v, idx) => (idx - i) % c === 0)
			} else {
				currCol = richBlocks.filter(
					(v, idx) => idx >= i * c && idx < (i + 1) * c
				)
			}
			if (direction === 'down' || direction === 'right') {
				currCol.reverse()
			}

			// 流程见processon
			let p = currCol.findIndex((v) => v.value > 0)
			let k
			while (p > -1 && p < c - 1) {
				let j = currCol.slice(p + 1, c).findIndex((v) => v.value > 0)
				if (j > -1) {
					k = j + p + 1
					if (currCol[p].value === currCol[k].value) {
						mergeTwoBlocks(currCol[p], currCol[k])
						canMerge = true
						if (k === c - 1) {
							break
						} else {
							p = k + 1
						}
					} else {
						p = k
					}
				} else {
					break
				}
			}
		}
		return canMerge
	}

	// 合并两个格子 p第一个 k第二个
	function mergeTwoBlocks(p, k) {
		// p值*2 k值=0
		p.value *= 2
		k.value = 0
		// 同步格子数据
		blocks[p.index] *= 2
		blocks[k.index] = 0
		// 同步视图
		let domP = document.getElementById('block-' + p.index)
		domP.innerText = p.value
		domP.className = `block block-${p.value}`
		gamePanel.removeChild(document.getElementById('block-' + k.index))
	}

	// 检查移动
	function checkMoveBlocks(direction) {
		let canMove = false
		// 检查每一列/行
		for (let i = 0; i < c; i++) {
			let richBlocks = blocks.map((value, index) => {
				return {
					value,
					index,
					moveCount: 0, // 移动几步
					moveToId: -1, // 移动后的id
				}
			})
			let currCol
			if (direction === 'top' || direction === 'down') {
				currCol = richBlocks.filter((v, idx) => (idx - i) % c === 0)
			} else {
				currCol = richBlocks.filter(
					(v, idx) => idx >= i * c && idx < (i + 1) * c
				)
			}
			if (direction === 'down' || direction === 'right') {
				currCol.reverse()
			}
			for (let j = 0; j < c; j++) {
				// 如果是0 后面的格子移动数量+1
				if (j > 1) {
					currCol[j].moveCount += currCol[j - 1].moveCount
				}
				if (currCol[j].value === 0 && j < c - 1) {
					currCol[j + 1].moveCount++
				}
				// 移动
				if (j > 0 && currCol[j].moveCount > 0 && currCol[j].value > 0) {
					switch (direction) {
						case 'top':
							currCol[j].moveToId =
								currCol[j].index - c * currCol[j].moveCount
							break
						case 'down':
							currCol[j].moveToId =
								currCol[j].index + c * currCol[j].moveCount
							break
						case 'left':
							currCol[j].moveToId =
								currCol[j].index - currCol[j].moveCount
							break
						case 'right':
							currCol[j].moveToId =
								currCol[j].index + currCol[j].moveCount
							break
					}
					blocks[currCol[j].moveToId] = currCol[j].value
					blocks[currCol[j].index] = 0
					moveBlock(currCol[j], direction)
					canMove = true
				}
			}
		}
		return canMove
	}

	// 移动格子 obj保存移动信息
	function moveBlock(obj, direction) {
		let b = document.getElementById('block-' + obj.index)
		if (direction === 'top' || direction === 'down') {
			b.style.top = t + Math.floor(obj.moveToId / c) * (w + m) + 'px'
		} else {
			b.style.left = l + (obj.moveToId % c) * (w + m) + 'px'
		}
		b.id = 'block-' + obj.moveToId
	}

	// 重置游戏
	function reset() {
		// 移除所有方块
		gamePanel.innerHTML = ''
		// 步数清零
		step.innerText = 0
		// 存放清零
		blocks = blocks.map(() => 0)
		// 生成2个方块
		createBlock2Or4(2)
	}

	init()
})()
