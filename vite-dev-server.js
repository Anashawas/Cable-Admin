import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Development server middleware for config management
export const configMiddleware = (server) => {
  server.middlewares.use('/api/dev/config', (req, res, next) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    const configDir = path.join(__dirname, 'public', 'config')
    
    if (req.method === 'GET') {
      // List available configs
      const configFiles = fs.readdirSync(configDir)
        .filter(file => file.startsWith('config.') && file.endsWith('.json'))
        .map(file => {
          const env = file.replace('config.', '').replace('.json', '')
          const filePath = path.join(configDir, file)
          const stats = fs.statSync(filePath)
          return {
            environment: env,
            file: file,
            lastModified: stats.mtime.toISOString(),
            size: stats.size
          }
        })

      res.setHeader('Content-Type', 'application/json')
      res.writeHead(200)
      res.end(JSON.stringify(configFiles, null, 2))
      return
    }

    if (req.method === 'POST') {
      let body = ''
      
      req.on('data', chunk => {
        body += chunk.toString()
      })
      
      req.on('end', () => {
        try {
          const { environment, config } = JSON.parse(body)
          
          if (!environment || !config) {
            res.writeHead(400)
            res.end(JSON.stringify({ error: 'Missing environment or config' }))
            return
          }

          // Validate environment
          const validEnvs = ['development', 'staging', 'production']
          if (!validEnvs.includes(environment)) {
            res.writeHead(400)
            res.end(JSON.stringify({ error: 'Invalid environment' }))
            return
          }

          // Validate JSON
          let parsedConfig
          try {
            parsedConfig = typeof config === 'string' ? JSON.parse(config) : config
          } catch (error) {
            res.writeHead(400)
            res.end(JSON.stringify({ error: 'Invalid JSON configuration' }))
            return
          }

          // Save the config file
          const configFile = path.join(configDir, `config.${environment}.json`)
          const formattedConfig = JSON.stringify(parsedConfig, null, 2)
          
          fs.writeFileSync(configFile, formattedConfig + '\n')
          
          res.setHeader('Content-Type', 'application/json')
          res.writeHead(200)
          res.end(JSON.stringify({ 
            success: true, 
            message: `Configuration for ${environment} saved successfully`,
            lastModified: new Date().toISOString()
          }))
        } catch (error) {
          res.writeHead(500)
          res.end(JSON.stringify({ error: error.message }))
        }
      })
      return
    }

    // Method not allowed
    res.writeHead(405)
    res.end('Method not allowed')
  })
}