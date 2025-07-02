import { Injectable, effect, inject, signal } from '@angular/core'
import { Auth, GoogleAuthProvider, connectAuthEmulator, signInWithPopup, signOut, user } from '@angular/fire/auth'
import { Firestore, connectFirestoreEmulator, deleteDoc, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore'
import { environment } from '../../environments/environment'
import type { StoredArray, UserData } from '../interfaces/firebase.interface'
import { LocationService } from './location.service'

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private auth = inject(Auth)
  private firestore = inject(Firestore)
  private locationService = inject(LocationService)

  public user = signal<UserData | null>(null)
  public loading = signal<boolean>(false)

  constructor() {
    // Connect to emulators in development
    if (!environment.production) this.connectToEmulators()

    // Listen to auth state changes
    user(this.auth).subscribe(user => {
      if (user) {
        this.user.set({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        })

        this.getFavoriteStops().then(stops => {
          this.locationService.favoriteStops.set(stops)
        })
      } else {
        this.user.set(null)
        this.locationService.favoriteStops.set(new Set())
      }
    })

    effect(() => {
      const favoriteStops = this.locationService.favoriteStops()
      if (!this.user()) return

      this.saveFavoriteStops(favoriteStops)
    })
  }

  private connectToEmulators() {
    try {
      // TODO: fetch values from firebase.json

      // Connect to Auth emulator
      connectAuthEmulator(this.auth, 'http://127.0.0.1:9099', { disableWarnings: true })

      // Connect to Firestore emulator
      connectFirestoreEmulator(this.firestore, '127.0.0.1', 8080)

      console.log('🔥 Connected to Firebase emulators')
    } catch (error) {
      // Emulators may already be connected
      console.log('Firebase emulators connection status:', error)
    }
  }

  public async signInWithGoogle(): Promise<void> {
    try {
      this.loading.set(true)

      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')

      const result = await signInWithPopup(this.auth, provider)

      if (!result.user) throw new Error('User not found')
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    } finally {
      this.loading.set(false)
    }
  }

  public async signOut(): Promise<void> {
    try {
      this.loading.set(true)

      await signOut(this.auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    } finally {
      this.loading.set(false)
    }
  }

  public async getFavoriteStops(): Promise<Set<string>> {
    const array = await this.getArray<string>('favorite_stops')
    return new Set(array?.data || [])
  }

  public async saveFavoriteStops(stops: Set<string>): Promise<void> {
    await this.updateArray('favorite_stops', Array.from(stops))
  }

  private async saveArray<T>(name: string, data: T[]): Promise<void> {
    const user = this.user()
    if (!user) {
      throw new Error('User must be authenticated to save data')
    }

    try {
      const arrayDoc = doc(this.firestore, name, user.uid)

      const arrayData: StoredArray<T> = {
        id: arrayDoc.id,
        name,
        data,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(arrayDoc, arrayData)
    } catch (error) {
      console.error('Error saving favorite stops:', error)
      throw error
    }
  }

  private async getArray<T>(name: string): Promise<StoredArray<T> | null> {
    const user = this.user()
    if (!user) {
      throw new Error('User must be authenticated to read data')
    }

    try {
      const arrayDoc = doc(this.firestore, name, user.uid)
      const docSnap = await getDoc(arrayDoc)

      if (docSnap.exists()) {
        const data = docSnap.data() as StoredArray<T>

        // Check if user owns this array
        if (data.userId !== user.uid) {
          throw new Error('Unauthorized access to array')
        }

        return data
      }

      return null
    } catch (error) {
      console.error('Error getting array:', error)
      throw error
    }
  }

  private async updateArray<T>(name: string, data: T[]): Promise<void> {
    const user = this.user()
    if (!user) {
      throw new Error('User must be authenticated to update data')
    }

    try {
      const arrayDoc = doc(this.firestore, name, user.uid)

      // First check if the array exists and belongs to the user
      const existingArray = await this.getArray(name)
      if (!existingArray) return this.saveArray(name, data)

      await updateDoc(arrayDoc, {
        data,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error updating array:', error)
      throw error
    }
  }

  private async deleteArray(name: string): Promise<void> {
    const user = this.user()
    if (!user) {
      throw new Error('User must be authenticated to delete data')
    }

    try {
      const arrayDoc = doc(this.firestore, name, user.uid)
      const docSnap = await getDoc(arrayDoc)

      // Array already deleted
      if (!docSnap.exists()) return

      await deleteDoc(arrayDoc)
    } catch (error) {
      console.error('Error deleting array:', error)
      throw error
    }
  }
}
