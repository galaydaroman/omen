import { eventsStorage } from '@/services/eventApi'
import type { StorageRecord } from '@/types'

type CallbackFunction = (value: number) => void

export default async function importEvents(file: File, callback?: CallbackFunction): Promise<void> {
  let error: Error | null = null;
  let leftover = '';
  let bytesProcessed = 0;
  let promiseImport: Promise<void> | null = null;

  const totalFileSize = file.size
  const stream = file.stream()
  const reader = stream.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break;

      const text = decoder.decode(value)
      const lines = (leftover + text).split(/\r?\n/)

      if (!done) {
        leftover = lines.pop() ?? ''
      }

      const items: StorageRecord[] = []
      lines.forEach(line => {
        if (line.trim() === '') return;

        let item: StorageRecord;

        try {
          item = JSON.parse(line)
        } catch (err) {
          console.error(err)
          throw new Error('Parsing file error')
        }

        if (item?.__type && !['Event', 'EventLog'].includes(item.__type)) {
          throw new Error('Import service cannot recognize record data type')
        }

        items.push(item as StorageRecord)
      })

      await promiseImport
      promiseImport = eventsStorage.importData(items)

      if (callback) {
        bytesProcessed += value.byteLength
        const percentage = (bytesProcessed / totalFileSize) * 100
        callback(percentage)
      }
    }

    await promiseImport

  } catch (err) {
    console.error(err)
    error = err as Error
  } finally {
    reader.releaseLock()
  }

  if (error) {
    throw new Error('Import failed: ' + error.message)
  }
}
