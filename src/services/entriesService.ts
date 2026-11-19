import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Entry } from '../types'

interface CreateEntryPayload {
  proteins: number
  fats: number
  carbs: number
  calories: number
}

export const observeUserEntries = (
  userId: string,
  onData: (entries: Entry[]) => void,
  onError: (error: Error) => void
) => {
  const entriesQuery = query(collection(db, 'entries'), where('userId', '==', userId))

  return onSnapshot(
    entriesQuery,
    (snapshot) => {
      const entries = snapshot.docs
        .map((snap) => {
          const data = snap.data() as Omit<Entry, 'id'>
          return {
            id: snap.id,
            ...data
          }
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs)

      onData(entries)
    },
    (error) => {
      onError(error)
    }
  )
}

export const createEntry = async (userId: string, payload: CreateEntryPayload) => {
  await addDoc(collection(db, 'entries'), {
    userId,
    proteins: payload.proteins,
    fats: payload.fats,
    carbs: payload.carbs,
    calories: payload.calories,
    createdAtMs: Date.now(),
    createdAt: serverTimestamp()
  })
}

export const removeEntryById = async (entryId: string) => {
  await deleteDoc(doc(db, 'entries', entryId))
}
