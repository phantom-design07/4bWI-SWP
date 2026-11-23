import { useEffect, useState, type FormEvent } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type CollectionReference,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../utils/firebase'
import './App.css'

type StudentRecord = {
  name: string
  participates: boolean
  assignedTo?: string | null
}

type Student = StudentRecord & {
  id: string
}

const studentCollection = collection(db, 'students') as CollectionReference<StudentRecord>
const currentYear = new Date().getFullYear()

function drawPartners(studentIds: string[]) {
  const shuffledIds = [...studentIds]
  for (let index = shuffledIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffledIds[index], shuffledIds[swapIndex]] = [shuffledIds[swapIndex], shuffledIds[index]]
  }

  const offset = Math.floor(Math.random() * (shuffledIds.length - 1)) + 1
  return new Map(
    shuffledIds.map((studentId, index) => [
      studentId,
      shuffledIds[(index + offset) % shuffledIds.length],
    ]),
  )
}

function App() {
  const [students, setStudents] = useState<Student[]>([])
  const [studentName, setStudentName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSavingRoster, setIsSavingRoster] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [error, setError] = useState('')

  const participants = students.filter((student) => student.participates)
  const participantIds = new Set(participants.map((student) => student.id))
  const assignedRecipients = participants.map((student) => student.assignedTo)
  const hasCurrentDraw =
    participants.length >= 2 &&
    participants.every(
      (student) =>
        student.assignedTo !== null &&
        student.assignedTo !== undefined &&
        student.assignedTo !== student.id &&
        participantIds.has(student.assignedTo),
    ) &&
    new Set(assignedRecipients).size === participants.length
  const studentsById = new Map(students.map((student) => [student.id, student]))

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
    setIsSavingRoster(true)
    try {
      const batch = writeBatch(db)
      students.forEach((currentStudent) => {
        batch.update(doc(studentCollection, currentStudent.id), {
          participates:
            currentStudent.id === student.id
              ? !student.participates
              : currentStudent.participates,
          assignedTo: null,
        })
      })
      await batch.commit()
    } catch (updateError) {
      setError(
        `Die Auswahl für ${student.name} konnte nicht gespeichert werden: ${updateError instanceof Error ? updateError.message : 'Unbekannter Fehler'}`,
      )
    } finally {
      setIsSavingRoster(false)
    }
  }

  async function removeStudent(student: Student) {
    setError('')
    setIsSavingRoster(true)
    try {
      const batch = writeBatch(db)
      students
        .filter((currentStudent) => currentStudent.id !== student.id)
        .forEach((currentStudent) => {
          batch.update(doc(studentCollection, currentStudent.id), { assignedTo: null })
        })
      batch.delete(doc(studentCollection, student.id))
      await batch.commit()
    } catch (deleteError) {
      setError(
        `${student.name} konnte nicht entfernt werden: ${deleteError instanceof Error ? deleteError.message : 'Unbekannter Fehler'}`,
      )
    } finally {
      setIsSavingRoster(false)
    }
  }

  async function handleDraw() {
    if (participants.length < 2 || isDrawing || isSavingRoster) return
    if (
      hasCurrentDraw &&
      !window.confirm('Möchtest du die bestehende Wichtel-Zuteilung wirklich neu auslosen?')
    ) {
      return
    }

    setError('')
    setIsDrawing(true)
    try {
      const assignments = drawPartners(participants.map((student) => student.id))
      const batch = writeBatch(db)
      students.forEach((student) => {
        batch.update(doc(studentCollection, student.id), {
          assignedTo: assignments.get(student.id) ?? null,
        })
      })
      await batch.commit()
    } catch (drawError) {
      setError(
        `Die Wichtelpartner konnten nicht zugeteilt werden: ${drawError instanceof Error ? drawError.message : 'Unbekannter Fehler'}`,
      )
    } finally {
      setIsDrawing(false)
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
                return (
                  <div className={`student-row${student.participates ? ' is-selected' : ''}`} key={student.id}>
                    <label className="student-choice">
                      <input
                        type="checkbox"
                        checked={student.participates}
                        disabled={isSavingRoster || isDrawing}
                        onChange={() => void toggleParticipation(student)}
                      />
                      <span className={`student-avatar avatar-${index % 5}`} aria-hidden="true">
                        {student.name.trim().charAt(0).toLocaleUpperCase('de')}
                      </span>
                      <span className="student-name">{student.name}</span>
                    </label>
                    {isSavingRoster || isDrawing ? (
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
          <button
            type="button"
            className="draw-button"
            disabled={isLoading || participants.length < 2 || isSavingRoster || isDrawing}
            onClick={() => void handleDraw()}
          >
            <span aria-hidden="true">{hasCurrentDraw ? '↻' : '✦'}</span>
            {isDrawing
              ? 'Wichtelpartner werden ausgelost …'
              : hasCurrentDraw
                ? 'Neu auslosen'
                : 'Wichtelpartner auslosen'}
          </button>
          <p className="draw-hint">
            {participants.length < 2
              ? 'Wähle mindestens zwei Personen aus.'
              : hasCurrentDraw
                ? 'Die aktuelle Zuteilung ist gespeichert.'
                : 'Jede Person bekommt genau eine andere Person zugelost.'}
          </p>
          <div className="summary-footer">
            <span className="footer-sparkle" aria-hidden="true">✳</span>
            <span>Deine Auswahl wird automatisch gespeichert.</span>
          </div>
        </aside>
      </section>

      {hasCurrentDraw && (
        <section className="draw-results" aria-labelledby="draw-results-heading">
          <div className="draw-results-heading">
            <div>
              <p className="section-kicker">DIE ZUTEILUNG</p>
              <h2 id="draw-results-heading">Die Wichtelpartner stehen fest!</h2>
            </div>
            <span className="draw-complete"><span /> Ziehung abgeschlossen</span>
          </div>
          <div className="draw-results-grid">
            {participants.map((student) => {
              const recipientName = studentsById.get(student.assignedTo ?? '')?.name ?? 'Unbekannt'
              return (
                <div className="draw-result-row" key={student.id}>
                  <span className="draw-person">{student.name}</span>
                  <span className="draw-arrow" aria-label="beschenkt">→</span>
                  <span className="draw-person recipient">{recipientName}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <footer className="page-footer">
        <span>Mit einer Prise Vorfreude gemacht <span aria-hidden="true">♥</span></span>
        <span>WICHTELWERK · {currentYear}</span>
      </footer>
    </main>
  )
}

export default App
