import Actions from './actions'
import Animator from './animation'
import Hardware from './hardware'
import Methods from './methods'
import React from 'react'
import Screen from './screen'
import ScreenMethods from './screenMethods'
import styles from './styles'
import { View } from 'react-native'

class Router extends React.Component {
  actions = new Actions()
  animator = new Animator(this.props.animations)
  state = { stack: [] }

  methods = new Methods(this)
  hardware = new Hardware(this.methods, this.props.disableHardwareBack)

  addScreen = (route, params, animation, onActionFinished, idShift = 0) => {
    const index = this.state.stack.length - idShift
    const id = `${index}-${route}-${parseInt(Math.random() * 10000)}`
    const Route = this.props.routes[route]
    const screenReferenceHandler = screen => {
      if (!screen) return

      const methods = new ScreenMethods(this, screen, index)
      const previous = this.state.stack.slice(0, -1)
      const last = this.state.stack[this.state.stack.length - 1]
      const stack = [...previous, { ...last, methods: { ...methods, id, route, params }, screen }]

      this.setTransition(screen.props.animation, this.state.stack, stack)
      screen.animateIn().then(() => { this.setStack({ stack }, onActionFinished) })
    }
    const screen = (
      <Screen animation={animation} animator={this.animator} key={id} ref={screenReferenceHandler}>
        <Route router={this.methods} {...params} />
      </Screen>
    )
    this.setStack({ stack: [...this.state.stack, screen] }, undefined, true)
  }

  componentDidMount = () => {
    this._isMounted = true
    this.addScreen(this.props.initialRoute, {}, { type: 'none' })
    this.hardware.subscribe()

    if (this.props.router) this.props.router(this.methods)
  }

  componentWillUnmount = () => {
    this.hardware.unsubscribe()
    this._isMounted = false
  }

  setStack = ({ stack }, onFinish, skipProps) => {
    if (this._isMounted) {
      this.setState({ stack }, onFinish)
      if (!skipProps && this.props.onStackChange) {
        this.props.onStackChange(stack.map(route => route.methods))
      }
    }
  }

  setTransition = (animation, from, to) => {
    if (this.props.onBeforeStackChange) {
      this.props.onBeforeStackChange(animation, from.map(route => route.methods), to.map(route => route.methods))
    }
  }

  render = () => <View style={styles.router}>{this.state.stack}</View>
}

export default Router
