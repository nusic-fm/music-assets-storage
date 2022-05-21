// const axios = require('axios')

const express = require('express')
const fileupload = require('express-fileupload')
const bodyParser = require('body-parser')
var cors = require('cors')
const CryptoJS = require('crypto-js')
const fs = require('fs')
// const { ethers } = require('ethers')
const { Web3Storage, File } = require('web3.storage')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 8080

app.use(cors())
app.use(fileupload())
app.use(express.static('files'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send('NUSIC protected filer server is up and running')
})

app.post('/upload', async (req, res) => {
  const buff = req.files.file.data
  const filename = req.files.file.name
  var wordArray = CryptoJS.lib.WordArray.create(buff) // Convert: ArrayBuffer -> WordArray
  var encrypted = CryptoJS.AES.encrypt(wordArray, process.env.ENCRYPTION_KEY).toString() // Encryption: I: WordArray -> O: -> Base64 encoded string (OpenSSL-format)
  const file = new File([encrypted], filename)
  const storage = new Web3Storage({
    token: process.env.WEB3STORAGE_TOKEN
  })
  const cid = await storage.put([file])
  res.status(200).send({ message: 'File Uploaded', cid })
})
// buffer - wordArray - encrypt - string
// string - decrypt - wordArray - buffer
app.get('/cid/:id', async (req, res) => {
  const storage = new Web3Storage({
    token: process.env.WEB3STORAGE_TOKEN
  })
  const response = await storage.get(req.params.id)
  console.log(`Got a response! [${response.status}] ${response.statusText}`)
  if (!response.ok) {
    throw new Error(`failed to get ${req.params.id} - [${response.status}] ${response.statusText}`)
  }
  // unpack File objects from the response
  const files = await response.files()
  const file = files[0]
  const arrayBuffer = await file.arrayBuffer()
  const str = new TextDecoder().decode(arrayBuffer)
  var decryptedData = CryptoJS.AES.decrypt(str, process.env.ENCRYPTION_KEY)
  const bff = CryptJsWordArrayToUint8Array(decryptedData)
  // TODO: Fix this
  fs.writeFileSync('decripted.wav', bff)
  res.sendFile('./decripted.wav', { root: __dirname })
  fs.rm('decripted.wav', {}, () => {
    console.log('removed')
  })
})

function CryptJsWordArrayToUint8Array(wordArray) {
  const l = wordArray.sigBytes
  const words = wordArray.words
  const result = new Uint8Array(l)
  let i = 0 /* dst */
  let j = 0 /* src */
  while (true) {
    // here i is a multiple of 4
    if (i === l) break
    var w = words[j++]
    result[i++] = (w & 0xff000000) >>> 24
    if (i === l) break
    result[i++] = (w & 0x00ff0000) >>> 16
    if (i === l) break
    result[i++] = (w & 0x0000ff00) >>> 8
    if (i === l) break
    result[i++] = w & 0x000000ff
  }
  return result
}

app.listen(port, () => console.log(`Listening on port ${port}!`))

// --------------------------------------
// app.post('/upload', async (req, res) => {
//   const file = req.files.file
//   file.mv('temp.wav', err => {
//     if (err) {
//       res.status(500).send({ message: 'File upload failed', code: 200 })
//     }
//     const buff = fs.readFileSync('temp.wav')
//     var key = '1234567887654321'
//     var wordArray = CryptoJS.lib.WordArray.create(buff) // Convert: ArrayBuffer -> WordArray
//     var encrypted = CryptoJS.AES.encrypt(wordArray, key).toString() // Encryption: I: WordArray -> O: -> Base64 encoded string (OpenSSL-format)
//     // const key = buff[buff.length - 1]

//     // // encrypt buffer contents
//     // buff = buff.map(x => x ^ key).map(x => ~x)

//     // // store the encryption key as last element
//     // buff[buff.length - 1] = key
//     fs.writeFileSync('temp-enc', encrypted)
//     fs.rm('temp.wav', {}, () => {
//       console.log('removed')
//     })
//     res.status(200).send({ message: 'File Uploaded', code: 200 })
//   })

// const NftAddress = ''
// const nftAbi = ['function name() view returns (string)', 'function transfer(address to, uint amount)']

// // Used for chainlink requests
// app.post('/update', async (req, res) => {
//   try {
//     const res = await axios.get(`https://kyc.blockpass.org/kyc/1.0/connect/${process.env.REACT_APP_CLIENT_ID}/applicants/approved`, {
//       headers: {
//         Authorization: process.env.REACT_APP_BLOCKPASS_APIKEY
//       }
//     })
//     const { records } = res.data
//     const allUserAddresses = records.map(rec => rec.refId)

//     const provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/649d2f691bb34ec99af554e6f41ba489')
//     const nftContract = new ethers.Contract(NftAddress, nftAbi, provider)
//     // nftContract
//     const signer = provider.getSigner()
//   } catch (e) {}
// })

// const files = await getFilesFromPath('temp-enc')
// file.mv('temp.wav', async err => {
//   if (err) {
//     res.status(500).send({ message: 'File upload failed', code: 200 })
//   }
//   const buff = fs.readFileSync('temp.wav')
//   fs.rm('temp.wav', {}, () => {
//     console.log('removed')
//   })
//   var wordArray = CryptoJS.lib.WordArray.create(buff) // Convert: ArrayBuffer -> WordArray
//   var encrypted = CryptoJS.AES.encrypt(wordArray, key).toString() // Encryption: I: WordArray -> O: -> Base64 encoded string (OpenSSL-format)
//   fs.writeFileSync('temp-enc', encrypted)

//   const storage = new Web3Storage({
//     token:
//       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDI4MzlDRUJFMjdjQjhmQjI5ZEM3YjBlNUYxYUM0MTFBOTY4ZDY0YTUiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTIxODMxMjUxNTgsIm5hbWUiOiJudXNpYy1tZXRhZGF0YS1sYXllciJ9.fabb15vVeiulzE83_9jDzFnl2vD-IIJ2OoX4qm4B6hs'
//   })
//   const files = await getFilesFromPath('temp-enc')
//   const cid = await storage.put(files)

//   res.status(200).send({ message: 'File Uploaded', cid })
//   fs.rm('temp-enc', {}, () => {
//     console.log('removed')
//   })
// })
// ---------------------
// files[0].mv('encrypted', async () => {
//   const str = fs.readFileSync('./encrypted', 'utf8')
//   fs.rm('encrypted', {}, () => {
//     console.log('removed')
//   })
//   var decryptedData = CryptoJS.AES.decrypt(str, key)
//   const bff = CryptJsWordArrayToUint8Array(decryptedData)
//   fs.writeFileSync('decr.wav', bff)
//   res.sendFile('./decr.wav', { root: __dirname })
//   fs.rm('decr.wav', {}, () => {
//     console.log('removed')
//   })
// })
// const str = fs.readFileSync('./temp-enc', 'utf8')
// // var words = CryptoJS.enc.Utf8.parse(buff)
// var decryptedData = CryptoJS.AES.decrypt(str, key)
// const bff = CryptJsWordArrayToUint8Array(decryptedData)
// fs.writeFileSync('decr.wav', bff)
// const key = buff[buff.length - 1]
// // encrypt buffer contents
// buff = buff.map(x => x ^ key).map(x => ~x)
// // store the encryption key as last element
// buff[buff.length - 1] = key
// fs.writeFileSync('decr.wav', buff)
// res.sendFile('./decr.wav', { root: __dirname })
// fs.rm('decr.wav', {}, () => {
//   console.log('removed')
// })
