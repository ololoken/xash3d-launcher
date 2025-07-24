export default <E extends Error>(e: string | E): never => { throw e }
