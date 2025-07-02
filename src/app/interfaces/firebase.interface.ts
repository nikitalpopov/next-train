export interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export interface StoredArray<T> {
  id: string
  name: string
  data: T[]
  userId: string
  createdAt: Date
  updatedAt: Date
}
