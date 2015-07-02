function program() {
    "use strict"

    // Famous dependencies
    let Engine         = require('famous/core/FamousEngine')
    let Camera         = require('famous/components/Camera')
    let Transitionable = require('famous/transitions/Transitionable')
    let Node           = require('famous/core/Node')
    let DOMElement     = require('famous/dom-renderables/DOMElement')
    let Scene          = require('famous/core/Scene')

    let cards = [] // storing temporary "cards" here to lay them out.

    // class BetterNode extends Node
    function BetterNode() {
        console.log('Huh?')
        Node.apply(this, arguments)
        console.log('What?')
    }

    BetterNode.prototype = Object.create(Node.prototype)
    BetterNode.prototype.constructor = BetterNode

    BetterNode.prototype.getPositionFrom = function getPositionFrom(ancestor) {
        var position = this.getPosition()
        var currentParent = this._parent
        var parentPosition

        var level = 1

        if (!(ancestor instanceof Node))
            throw new Error(''+ancestor+' is not an instance of Node.')

        // Go through all the nodes up through the ancestor.
        while (currentParent && currentParent !== ancestor) {
            parentPosition = currentParent.getPosition()

            position[0] += parentPosition[0]
            position[1] += parentPosition[1]
            position[2] += parentPosition[2]

            currentParent = currentParent._parent
            level+=1
            //console.log('parent position:', parentPosition)
        }

        if (!currentParent)
            throw new Error(''+ancestor+' is not an ancestor of this '+this)

        //console.log('-- level:', level, position)
        return position
    }
    // TEST for getScenePosition()
    //let Engine = famous.core.FamousEngine;
    //var scene = Engine.createScene('.scene')
    //var node1 = scene.addChild(new BetterNode).setPosition(10,0,0)
    //var node2 = node1.addChild(new BetterNode).setPosition(20,0,0)
    //var node3 = node2.addChild(new BetterNode).setPosition(5,0,0)
    //var pos = node3.getPositionFrom(node2)
    //console.log(pos)

    // class Layout extends BetterNode
    function Layout() {
        BetterNode.apply(this, arguments)
        this.columnWidth    = 200 + 20
        this.rowHeight      = 95 + 20
        this.childrenGetter = null
        this.rootItems      = null

        window.n = this
    }

    Layout.prototype = Object.create(BetterNode.prototype)
    Layout.prototype.constructor = Layout

    // traverses the trees in rootItems recursively.
    Layout.prototype.createLayout = function createLayout(numberOfLevels) {
        if (!this.childrenGetter)
            throw new Error(`
                You need to set the child getter with Layout#setChildrenGetter first.
            `.trim().replace(/\s/, ' '))
        if (!this.rootItems)
            throw new Error(`
                You need to specify the root nodes with Layout#setRootItems first.
            `.trim().replace(/\s/, ' '))

        let self = this
        let initialLevels = numberOfLevels

        // TODO: Remove. Random colors for now.
        var colors = []
        for (let i=0; i<numberOfLevels; i+=1)
            colors.push(`rgb(${
                Math.ceil(Math.random()*255)},${
                Math.ceil(Math.random()*255)},${
                Math.ceil(Math.random()*255)})`)

        function _createLayout(numberOfLevels, currentLevelItems) {
            var currentLevelLayoutNodes = []

            if (numberOfLevels > 0) {
                for (let i=0, len1=currentLevelItems.length; i<len1; i+=1) {
                    let currentItem = currentLevelItems[i]
                    let currentLevelLayoutNode = (new BetterNode())
                        .setOrigin(0.5,0.5)
                        .setAlign(0,0)
                        .setMountPoint(0,0)
                        .setSizeMode('absolute', 'absolute')
            console.log('WTF')

                    /*
                     * TODO: Remove. These are temporary DOMElements to visualize
                     * the layout spaces, shared globally for the entry point to manipulate.
                     * Cards will be added externally.
                     */
                    let cardNode = scene.addChild(new BetterNode)
                        .setOrigin(0.5,0.5)
                        .setAlign(0,0)
                        .setMountPoint(0,0)
                        .setSizeMode('absolute', 'absolute')
                        .setAbsoluteSize(self.columnWidth,self.rowHeight)
                    let card = new DOMElement(cardNode, {
                        content: `<div style="width: 100%; height: 100%; border: 10px solid white; background: ${colors[numberOfLevels-1]}"></div>`
                    })
                    cards.push(cardNode)
                    cardNode.goToNode = currentLevelLayoutNode

                    new DOMElement(currentLevelLayoutNode, {
                        content: `<div style="width: 100%; height: 100%; border: 10px solid white; background: ${colors[numberOfLevels-1]}; opacity: 0.5"></div>`
                    })

                    currentLevelLayoutNodes.push(currentLevelLayoutNode)

                    let childItems = self.childrenGetter(currentItem, numberOfLevels)
                    let childLayoutNodes = _createLayout(numberOfLevels-1, childItems)

                    for (let j=0, len2=childLayoutNodes.length; j<len2; j+=1) {
                        currentLevelLayoutNode.addChild(childLayoutNodes[j])
                    }

                    // Width and height are multiples of rowHeight and
                    // columnWidth respectively.
                    // TODO, spacing, etc.
                    let sizeX = 0

                    // Cards at level 1 and 2 are the base width.
                    if (numberOfLevels < 3) sizeX = self.columnWidth

                    // otherwise add the widths of the children.
                    else for (let j=0, len2=childLayoutNodes.length; j<len2; j+=1)
                        sizeX += childLayoutNodes[j].getAbsoluteSize()[0]

                    //console.log('-- level, sizeX', numberOfLevels, sizeX)

                    currentLevelLayoutNode.setAbsoluteSize(
                        // the width a multiple of columnWidth and at
                        // least one columnWidth.
                        sizeX,

                        // all nodes are just rowHeight for now.
                        self.rowHeight
                    )

                    let positionX = 0
                    let positionY = self.rowHeight

                    // only the first level is positioned at Y = 0
                    if (initialLevels-numberOfLevels === 0) positionY = 0

                    // place cells from left to right in each level.
                    if (i-1 >= 0) {
                        let previousSizeX = currentLevelLayoutNodes[i-1].getAbsoluteSize()[0]
                        let previousPositionX = currentLevelLayoutNodes[i-1].getPosition()[0]
                        positionX = previousPositionX + previousSizeX
                    }

                    // except in the last level stack cells
                    if (numberOfLevels == 1) {
                        positionX = 0
                        positionY = positionY + i * positionY
                    }

                    currentLevelLayoutNode.setPosition(
                        positionX, positionY, 0
                    )
                    console.log('curent layout node position: ', currentLevelLayoutNode.getPosition())
                }
            }

            return currentLevelLayoutNodes
        }

        let rootLayoutNodes = _createLayout(numberOfLevels, this.rootItems)
        console.log('--------------- root layout nodes', rootLayoutNodes)

        for (let i=0, len=rootLayoutNodes.length; i<len; i+=1) {
            this.addChild(rootLayoutNodes[i])
        }
    }

    // set an array of items that are the roots of trees representing
    // the structure of the layout (the relationships of cards).
    Layout.prototype.setRootItems = function setRootItems(roots) {
        this.rootItems = roots
    }

    // fn called as fn(item, level) where item is the current item
    // being layed out and level is the current level in the map
    // layout.
    // fn should return an array of children.
    Layout.prototype.setChildrenGetter = function setChildrenGetter(fn) {
        this.childrenGetter = fn
    }

    // just a node structure representing the map layout spaces.
    // class MapNode
    function MapNode() {
        this.children = []
        this.parent = null
    }

    let mapNodeList = []
    function createRandomMapNodes(numberOfLevels) {
        let currentLevelNodes = []
        let numberOfNodesThisLevel = Math.ceil(Math.random() * 3)

        if (numberOfLevels > 0) {
            for (let i=0; i<numberOfNodesThisLevel; i+=1) {
                let node = new MapNode()
                currentLevelNodes.push(node)
                mapNodeList.push(node)

                let children = createRandomMapNodes(numberOfLevels - 1)
                node.children = children
            }
        }
        return currentLevelNodes
    }

    Engine.init()
    var scene = Engine.createScene('body')

    // make some random map nodes to arrange
    let numberOfMapLevels = 6
    let userStoryMapRoots = createRandomMapNodes(numberOfMapLevels)

    var layout = new Layout()
    layout.setRootItems(userStoryMapRoots)
    layout.setChildrenGetter(function(mapNode, level) {
        return mapNode.children
    })
    layout.createLayout(numberOfMapLevels)
    scene.addChild(layout)

    // TODO: use the real cards. For now the current sample they are added
    // inside the layout.
    console.log('number of cards:', cards.length)
    for (let i=0, len=cards.length; i<len; i+=1) {
        //let goToPosition = cards[i].goToNode.getPositionFrom(scene)
        //cards[i].setPosition(goToPosition[0],goToPosition[1],goToPosition[2])
        //console.log(cards[i].getPosition() === cards[i].goToNode.getPositionFrom(scene))
        console.log('position of node from scene', cards[i].goToNode.getPositionFrom(scene))
    }

    let cameraNode = scene.addChild()
    let camera = new Camera(cameraNode)
    camera.setDepth(1000)

    // animate the camera. TODO: This will be controlled with zoom...
    let camPositionZ = new Transitionable(0)
    ~function loop() {
        camPositionZ.to(10000, 'easeInOut', 6000).to(0, 'easeInOut', 6000, loop)
    }()

    let cameraAnimation = cameraNode.addComponent({
        onUpdate: function() {
            cameraNode.setPosition(0,0,camPositionZ.get())
            cameraNode.requestUpdateOnNextTick(cameraAnimation)
        }
    })
    cameraNode.requestUpdateOnNextTick(cameraAnimation)

}

program()
