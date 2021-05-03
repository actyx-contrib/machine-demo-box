import { OPCUAServer } from 'node-opcua'
import { simulateMachine } from './simulation'

const port = parseInt(process.env.OPCUA_MOCK_PORT || '4334')

const server = new OPCUAServer({
  port: port,
  resourcePath: '/UA/actyx/',
  buildInfo: {
    productName: 'ActyxMockPlc',
    buildNumber: '1',
    buildDate: new Date(2021, 5, 3),
  },
  userManager: {
    isValidUser: (username, password) => username === 'actyx' && password === 'actyx',
  },
})

const setupValues = async (server: OPCUAServer) => {
  const addressSpace = server.engine.addressSpace
  if (addressSpace) {
    const namespace = addressSpace.getOwnNamespace()
    const device = namespace.addObject({
      organizedBy: addressSpace.rootFolder.objects,
      browseName: 'mockPlc',
    })
    simulateMachine(device, namespace)
  }
}

// main entry-point for the opcua mock
const main = async () => {
  // init opcua server internals
  await server.initialize()
  // setup values provided by the OPCUA server
  await setupValues(server)
  // listen to port and show log message for the user
  server.start(() => {
    // multiple endpoints are supported. Reduce/Join will merge all ports to one coma separated string
    console.log(
      `Server is now listening on port ${server.endpoints
        .reduce<number[]>((acc, ep) => [...acc, ep.port], [])
        .join(',')} (press CTRL+C to stop)`,
    )
  })
}
main()
