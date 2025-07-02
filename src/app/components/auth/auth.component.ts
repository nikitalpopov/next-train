import { CommonModule } from '@angular/common'
import { Component, inject, signal } from '@angular/core'
import type { StoredArray } from '../../interfaces/firebase.interface'
import { FirebaseService } from '../../services/firebase.service'

@Component({
  selector: 'app-auth',
  imports: [CommonModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  private firebaseService = inject(FirebaseService)

  protected user = this.firebaseService.user
  protected loading = this.firebaseService.loading

  protected arrays = signal<StoredArray<any>[]>([])

  protected async signInWithGoogle() {
    try {
      await this.firebaseService.signInWithGoogle()
    } catch (error) {
      console.error('Sign in failed:', error)
      alert('Sign in failed. Please try again.')
    }
  }

  protected async signOut() {
    try {
      await this.firebaseService.signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
      alert('Sign out failed. Please try again.')
    }
  }

  protected formatDate(date: Date): string {
    return new Date(date).toLocaleString()
  }
}
