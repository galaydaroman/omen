const CURRENT_DATABASE_REFERENCE_KEY = 'omen-storage-key'
const DATABASE_NAME = 'omen-events'
const TEST_DATABASE_NAME = 'omen-test-events'

export function currentStorageDatabaseName(): string {
  const storageKey = localStorage.getItem(CURRENT_DATABASE_REFERENCE_KEY)
  return storageKey || DATABASE_NAME
}

export function isTestStorageDatabase(): boolean {
  return currentStorageDatabaseName() === TEST_DATABASE_NAME
}

export function resetToStorageDatabase(test: boolean): void {
  const storageKey = test ? TEST_DATABASE_NAME : DATABASE_NAME
  localStorage.setItem(CURRENT_DATABASE_REFERENCE_KEY, storageKey)
}
