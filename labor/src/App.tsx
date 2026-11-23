import { useEffect, useState, type FormEvent } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type CollectionReference,
} from 'firebase/firestore'
import { db } from '../utils/firebase'
import './App.css'

type StudentRecord = {
  name: string
  participates: boolean
}

type Student = StudentRecord & {
  id: string
}

const studentCollection = collection(db, 'students') as CollectionReference<StudentRecord>
const currentYear = new Date().getFullYear()

function App() {
  const [students, setStudents] = useState<Student[]>([])
  const [studentName, setStudentName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [busyStudentIds, setBusyStudentIds] = useState<string[]>([])
  const [error, setError] = useState('')

  const participants = students.filter((student) => student.participates)

  useEffect(() => {
    const studentsQuery = query(studentCollection, orderBy('name'))
    const unsubscribe = onSnapshot(
      studentsQuery,
      (snapshot) => {
        setStudents(snapshot.docs.map((studentDoc) => ({ id: studentDoc.id, ...studentDoc.data() })))
        setIsLoading(false)
      },
      (snapshotError) => {
        setError(`Die Schülerliste konnte nicht geladen werden: ${snapshotError.message}`)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  async function handleAddStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = studentName.trim()
    if (!name) return

    const alreadyExists = students.some(
      (student) => student.name.toLocaleLowerCase('de') === name.toLocaleLowerCase('de'),
    )
    if (alreadyExists) {
      setError('Dieser Name steht bereits auf der Schülerliste.')
      return
    }

    setError('')
    setIsAdding(true)
    try {
      await addDoc(studentCollection, { name, participates: false })
      setStudentName('')
    } catch (addError) {
      setError(
        `Der Schüler konnte nicht gespeichert werden: ${addError instanceof Error ? addError.message : 'Unbekannter Fehler'}`,
      )
    } finally {
      setIsAdding(false)
    }
  }

  async function toggleParticipation(student: Student) {
    setError('')
    setBusyStudentIds((current) => [...current, student.id])
    try {
      await updateDoc(doc(studentCollection, student.id), {
        participates: !student.participates,
      })
    } catch (updateError) {
      setError(
        `Die Auswahl für ${student.name} konnte nicht gespeichert werden: ${updateError instanceof Error ? updateError.message : 'Unbekannter Fehler'}`,
      )
    } finally {
      setBusyStudentIds((current) => current.filter((id) => id !== student.id))
    }
  }

  async function removeStudent(student: Student) {
    setError('')
    setBusyStudentIds((current) => [...current, student.id])
    try {
      await deleteDoc(doc(studentCollection, student.id))
    } catch (deleteError) {
      setError(
        `${student.name} konnte nicht entfernt werden: ${deleteError instanceof Error ? deleteError.message : 'Unbekannter Fehler'}`,
      )
    } finally {
      setBusyStudentIds((current) => current.filter((id) => id !== student.id))
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>Wichtelwerk</span>
        </div>
        <span className="season-label"><span className="season-dot" /> Die schönste Zeit des Jahres</span>
      </header>

      <section className="welcome">
        <div className="welcome-copy">
          <p className="eyebrow"><span aria-hidden="true">✦</span> GEHEIMNISSE LIEGEN IN DER LUFT</p>
          <h1>Die Wichtel-<br className="mobile-break" />zentrale<span>.</span></h1>
          <p className="welcome-description">
            Wer ist dieses Jahr dabei? Stelle deine Klasse zusammen und mach die Vorfreude offiziell.
          </p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <span className="art-sparkle sparkle-one">✳</span>
          <span className="art-sparkle sparkle-two">✦</span>
          <div className="gift gift-back"><span /></div>
          <div className="gift gift-front"><span /></div>
          <span className="art-dot dot-one" />
          <span className="art-dot dot-two" />
          <span className="art-dot dot-three" />
        </div>
      </section>

      <section className="content-grid" aria-label="Wichteln organisieren">
        <div className="roster-card">
          <div className="card-heading">
            <div>
              <p className="section-kicker">DEINE GRUPPE</p>
              <h2>Wer wichtelt mit?</h2>
            </div>
            <div className="count-badge" aria-label={`${participants.length} Teilnehmende`}>
              <span>{participants.length}</span>
              <span className="count-divider">/</span>
              <span className="count-total">{students.length}</span>
            </div>
          </div>

          <p className="card-description">Wähle alle aus, die bei der Wichtelrunde mitmachen.</p>

          {error && (
            <div className="error-message" role="alert">
              <span aria-hidden="true">!</span>
              {error}
              <button type="button" className="dismiss-error" onClick={() => setError('')} aria-label="Meldung schließen">
                ×
              </button>
            </div>
          )}

          <div className="student-list" aria-live="polite">
            {isLoading ? (
              <p className="list-message">Schülerliste wird geladen …</p>
            ) : students.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">☆</span>
                <p>Noch ist die Liste leer.</p>
                <span>Füge unten deine Klasse hinzu.</span>
              </div>
            ) : (
              students.map((student, index) => {
                const isBusy = busyStudentIds.includes(student.id)
                return (
                  <div className={`student-row${student.participates ? ' is-selected' : ''}`} key={student.id}>
                    <label className="student-choice">
                      <input
                        type="checkbox"
                        checked={student.participates}
                        disabled={isBusy}
                        onChange={() => void toggleParticipation(student)}
                      />
                      <span className={`student-avatar avatar-${index % 5}`} aria-hidden="true">
                        {student.name.trim().charAt(0).toLocaleUpperCase('de')}
                      </span>
                      <span className="student-name">{student.name}</span>
                    </label>
                    {isBusy ? (
                      <span className="saving-indicator">Speichert …</span>
                    ) : (
                      <button
                        type="button"
                        className="remove-student"
                        aria-label={`${student.name} aus der Liste entfernen`}
                        title="Aus der Liste entfernen"
                        onClick={(event) => {
                          event.preventDefault()
                          void removeStudent(student)
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <form className="add-student-form" onSubmit={(event) => void handleAddStudent(event)}>
            <label htmlFor="student-name">Schüler:in hinzufügen</label>
            <div className="form-controls">
              <input
                id="student-name"
                name="student-name"
                type="text"
                placeholder="Vor- und Nachname"
                value={studentName}
                maxLength={80}
                onChange={(event) => setStudentName(event.target.value)}
                required
              />
              <button type="submit" className="add-button" disabled={isAdding || !studentName.trim()}>
                <span aria-hidden="true">+</span>
                {isAdding ? 'Wird hinzugefügt …' : 'Hinzufügen'}
              </button>
            </div>
          </form>
        </div>

        <aside className="summary-card">
          <div className="summary-top">
            <span className="summary-icon" aria-hidden="true">✦</span>
            <span className="summary-tag">DEIN WICHTELKREIS</span>
          </div>
          <h2>Ein bisschen<br />Weihnachtszauber.</h2>
          <p className="summary-copy">
            {participants.length === 0
              ? 'Deine Wichtelrunde nimmt Gestalt an. Wähle die ersten Mitspielenden aus!'
              : participants.length === 1
                ? 'Eine Person ist schon dabei. Fürs Wichteln braucht es mindestens zwei!'
                : `Schon ${participants.length} Personen sind mit dabei. Das wird eine schöne Bescherung!`}
          </p>
          <div className="participant-preview">
            <p className="preview-label">DABEI SIND</p>
            {participants.length === 0 ? (
              <span className="preview-empty">Noch niemand ausgewählt</span>
            ) : (
              <div className="participant-chips">
                {participants.map((student) => (
                  <span className="participant-chip" key={student.id}>
                    <span className="chip-dot" />
                    {student.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="summary-footer">
            <span className="footer-sparkle" aria-hidden="true">✳</span>
            <span>Deine Auswahl wird automatisch gespeichert.</span>
          </div>
        </aside>
      </section>

      <footer className="page-footer">
        <span>Mit einer Prise Vorfreude gemacht <span aria-hidden="true">♥</span></span>
        <span>WICHTELWERK · {currentYear}</span>
      </footer>
    </main>
  )
}

export default App
