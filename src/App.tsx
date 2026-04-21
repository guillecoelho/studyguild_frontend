import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import Footer from './components/Footer'
import AboutPage from './pages/AboutPage'
import Homepage from './pages/Homepage'
import IssuesPage from './pages/IssuesPage'
import IssueStatusEntryPage from './pages/IssueStatusEntryPage'
import IssueStatusPage from './pages/IssueStatusPage'
import LoginPage from './pages/LoginPage'
import NewsletterAdminPage from './pages/NewsletterAdminPage'
import NewsletterEntryPage from './pages/NewsletterEntryPage'
import NewsletterPage from './pages/NewsletterPage'
import NewReunionPage from './pages/NewReunionPage'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/PublicProfilePage'
import ReunionDetailsPage from './pages/ReunionDetailsPage'
import StudentGroupsPage from './pages/StudentGroupsPage'
import type { InstitutionItem } from './components/InstitutionSelect'
import {
  getCurrentUser,
  getInstitutions,
  loginUser,
  logoutUser,
  registerUser,
  updateCurrentUserProfile,
} from './services/authApi'
import {
  createReunionMessage,
  createReunion,
  getReunionMessages,
  getReunionDetails,
  joinReunion,
  loadDashboardData,
  refreshReunions,
  subscribeToReunionMessages,
} from './services/reunionsApi'
import type { AuthUser, UpdateProfilePayload } from './types/auth'
import type { Reunion, ReunionMessage, ReunionPayload, StudentGroup, Subject } from './types/reunions'

function App() {
  const { i18n, t } = useTranslation()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [reunions, setReunions] = useState<Reunion[]>([])
  const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null)
  const [selectedReunionMessages, setSelectedReunionMessages] = useState<ReunionMessage[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [flashMessage, setFlashMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [joinFeedback, setJoinFeedback] = useState('')
  const [messageFeedback, setMessageFeedback] = useState('')
  const [pageError, setPageError] = useState('')
  const [detailsError, setDetailsError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [hasLoadedDashboard, setHasLoadedDashboard] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([])
  const location = useLocation()
  const navigate = useNavigate()

  const reunionRouteMatch = location.pathname.match(/^\/reunion\/(\d+)$/)
  const selectedReunionId = reunionRouteMatch ? Number(reunionRouteMatch[1]) : null

  const isAuthenticated = currentUser !== null
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    async function loadSession() {
      setIsAuthLoading(true)

      try {
        setCurrentUser(await getCurrentUser())
      } catch {
        setCurrentUser(null)
      } finally {
        setIsAuthLoading(false)
      }
    }

    void loadSession()
  }, [])

  useEffect(() => {
    function handleSessionExpired() {
      setCurrentUser(null)
    }
    window.addEventListener('sessionexpired', handleSessionExpired)
    return () => window.removeEventListener('sessionexpired', handleSessionExpired)
  }, [])

  useEffect(() => {
    async function loadInstitutions() {
      try {
        setInstitutions(await getInstitutions())
      } catch {
        setInstitutions([])
      }
    }

    void loadInstitutions()
  }, [])

  useEffect(() => {
    async function loadDependencies() {
      setIsLoading(true)
      setPageError('')

      try {
        const dashboardData = await loadDashboardData()
        setSubjects(dashboardData.subjects)
        setGroups(dashboardData.groups)
        setReunions(dashboardData.reunions)
      } catch {
        setPageError(i18n.t('errors.loadDashboard'))
      } finally {
        setIsLoading(false)
        setHasLoadedDashboard(true)
      }
    }

    void loadDependencies()
  }, [i18n])

  useEffect(() => {
    if (!hasLoadedDashboard) {
      return
    }

    const controller = new AbortController()
    const debounceTimeout = window.setTimeout(async () => {
      setIsLoading(true)
      setPageError('')

      try {
        setReunions(
          await refreshReunions(
            {
              q: searchQuery,
            },
            controller.signal,
          ),
        )
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setPageError(i18n.t('errors.loadDashboard'))
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(debounceTimeout)
    }
  }, [searchQuery, hasLoadedDashboard, i18n])

  useEffect(() => {
    if (selectedReunionId === null) {
      return
    }

    const reunionId = selectedReunionId

    const controller = new AbortController()

    async function loadReunionDetails() {
      setIsDetailsLoading(true)
      setIsMessagesLoading(true)
      setDetailsError('')
      setMessageError('')

      try {
        const [reunion, messages] = await Promise.all([
          getReunionDetails(reunionId, controller.signal),
          getReunionMessages(reunionId, controller.signal),
        ])

        setSelectedReunion(reunion)
        setSelectedReunionMessages(messages)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setDetailsError(t('errors.loadReunionDetails'))
        setMessageError(t('errors.loadReunionMessages'))
      } finally {
        if (!controller.signal.aborted) {
          setIsDetailsLoading(false)
          setIsMessagesLoading(false)
        }
      }
    }

    void loadReunionDetails()

    return () => {
      controller.abort()
    }
  }, [selectedReunionId, t])

  useEffect(() => {
    const currentUserId = currentUser?.id
    const isParticipant =
      typeof currentUserId === 'number' &&
      selectedReunion?.participant_student_ids?.includes(currentUserId)

    if (
      !isAuthenticated ||
      selectedReunionId === null ||
      !isParticipant
    ) {
      return
    }

    const unsubscribe = subscribeToReunionMessages(selectedReunionId, {
      onMessageCreated(message) {
        setSelectedReunionMessages((current) => {
          if (current.some((currentMessage) => currentMessage.id === message.id)) {
            return current
          }

          return [...current, message]
        })
      },
    })

    return () => {
      unsubscribe()
    }
  }, [currentUser?.id, isAuthenticated, selectedReunion, selectedReunionId])

  useEffect(() => {
    if (selectedReunionId !== null) {
      return
    }

    setSelectedReunion(null)
    setSelectedReunionMessages([])
    setJoinFeedback('')
    setMessageFeedback('')
    setDetailsError('')
    setMessageError('')
  }, [selectedReunionId])

  async function handleSubmit(payload: ReunionPayload) {
    setIsSubmitting(true)

    try {
      const createdReunion = await createReunion(payload)

      if (createdReunion && typeof createdReunion === 'object' && 'id' in createdReunion) {
        setReunions((current) => [createdReunion, ...current])
      } else {
        setReunions(await refreshReunions())
      }

      setFlashMessage(t('flash.reunionCreated'))
      navigate('/')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleJoinReunion() {
    if (!selectedReunionId) {
      return
    }

    if (!isAuthenticated) {
      setDetailsError(t('auth.loginRequiredForJoin'))
      return
    }

    if (typeof currentUser?.id !== 'number') {
      setDetailsError(t('auth.loginRequiredForJoin'))
      return
    }

    setIsJoining(true)
    setJoinFeedback('')
    setDetailsError('')

    try {
      const joinedReunion = await joinReunion(selectedReunionId, currentUser.id)
      setJoinFeedback(t('flash.joinedReunion'))
      setSelectedReunion(joinedReunion)
      setReunions(
        await refreshReunions({
          q: searchQuery,
        }),
      )
    } catch {
      setDetailsError(t('errors.joinReunion'))
    } finally {
      setIsJoining(false)
    }
  }

  async function handleSendMessage(content: string) {
    if (!selectedReunionId) {
      return
    }

    if (!isAuthenticated || typeof currentUser?.id !== 'number') {
      setMessageError(t('auth.loginRequiredForJoin'))
      return
    }

    setIsSendingMessage(true)
    setMessageFeedback('')
    setMessageError('')

    try {
      const createdMessage = await createReunionMessage(selectedReunionId, currentUser.id, content)
      setSelectedReunionMessages((current) => {
        if (current.some((message) => message.id === createdMessage.id)) {
          return current
        }

        return [...current, createdMessage]
      })
      setMessageFeedback(t('flash.messageSent'))
    } catch {
      setMessageError(t('errors.sendReunionMessage'))
    } finally {
      setIsSendingMessage(false)
    }
  }

  async function handleLogin(email: string, password: string) {
    setAuthError('')
    setIsAuthSubmitting(true)

    try {
      const loggedUser = await loginUser(email, password)
      setCurrentUser(loggedUser)
      setProfileError('')
      setProfileSuccess('')
      navigate('/')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : t('errors.authLogin'))
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  async function handleLogout() {
    setAuthError('')
    setIsAuthSubmitting(true)

    try {
      await logoutUser()
      setCurrentUser(null)
      setJoinFeedback('')
      setDetailsError('')
      setProfileError('')
      setProfileSuccess('')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : t('errors.authLogout'))
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  async function handleRegister(payload: {
    email: string
    password: string
    passwordConfirmation: string
    firstName: string
    lastName: string
    institutionId: number
    profilePhoto?: File | null
  }) {
    setAuthError('')
    setIsAuthSubmitting(true)

    try {
      const registeredUser = await registerUser(payload)
      setCurrentUser(registeredUser)
      setFlashMessage(t('flash.registeredAndLogged'))
      setProfileError('')
      setProfileSuccess('')
      navigate('/')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : t('errors.authRegister'))
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  async function handleProfileUpdate(payload: UpdateProfilePayload) {
    setProfileError('')
    setProfileSuccess('')
    setIsAuthSubmitting(true)

    try {
      const updatedUser = await updateCurrentUserProfile(payload)
      setCurrentUser(updatedUser)
      setProfileSuccess(t('profile.saved'))
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : t('errors.profileUpdate'))
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  return (
    <main className="fantasy-shell relative min-h-screen overflow-hidden px-4 py-8 sm:px-8 lg:px-16">
      <div className="pointer-events-none absolute inset-0 fantasy-mist" />

      <Header
        isAuthenticated={isAuthenticated}
        isAuthSubmitting={isAuthSubmitting}
        onNavigateHome={() => navigate('/')}
        onNavigateProfile={() => navigate('/profile')}
        onNavigateAuth={() => navigate('/auth')}
        onLogout={() => {
          void handleLogout()
          navigate('/')
        }}
      />

      <Routes>
        <Route
          path="/"
          element={
            <Homepage
              reunions={reunions}
              subjects={subjects}
              isLoading={isLoading}
              pageError={pageError}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              flashMessage={flashMessage}
              onDismissFlashMessage={() => setFlashMessage('')}
              onNavigateToNewReunion={() => {
                setFlashMessage('')
                navigate('/reunion/new')
              }}
              onNavigateToStudentGroups={() => {
                setFlashMessage('')
                navigate('/student-groups')
              }}
              onNavigateToReunionDetails={(reunionId) => {
                setFlashMessage('')
                setJoinFeedback('')
                setDetailsError('')
                navigate(`/reunion/${reunionId}`)
              }}
            />
          }
        />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route
          path="/auth"
          element={
            <LoginPage
              currentUser={currentUser}
              institutions={institutions}
              isAuthLoading={isAuthLoading}
              isAuthSubmitting={isAuthSubmitting}
              authError={authError}
              onLogin={handleLogin}
              onRegister={handleRegister}
              onLogout={handleLogout}
              onBackToHomepage={() => navigate('/')}
            />
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated && currentUser ? (
              <ProfilePage
                currentUser={currentUser}
                institutions={institutions}
                isSubmitting={isAuthSubmitting}
                submitError={profileError}
                submitSuccess={profileSuccess}
                onSubmit={handleProfileUpdate}
                onBackToHomepage={() => navigate('/')}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/newsletter"
          element={
            <NewsletterPage
              onBackToHomepage={() => navigate('/')}
            />
          }
        />
        <Route
          path="/newsletter/:id"
          element={
            <NewsletterEntryPage
              isAuthenticated={isAuthenticated}
              currentUserId={currentUser?.id ?? null}
              onBackToNewsletter={() => navigate('/newsletter')}
            />
          }
        />
        <Route
          path="/newsletter/admin"
          element={
            <NewsletterAdminPage
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              onBackToHomepage={() => navigate('/')}
              onOpenLogin={() => navigate('/auth')}
            />
          }
        />
        <Route
          path="/about"
          element={
            <AboutPage
              onBackToHomepage={() => navigate('/')}
            />
          }
        />
        <Route
          path="/issues"
          element={
            <IssuesPage
              isAuthenticated={isAuthenticated}
              onBackToHomepage={() => navigate('/')}
              onOpenLogin={() => navigate('/auth')}
            />
          }
        />
        <Route
          path="/issues/status"
          element={
            <IssueStatusPage
              onBackToHomepage={() => navigate('/')}
            />
          }
        />
        <Route
          path="/issues/status/:id"
          element={
            <IssueStatusEntryPage
              onBackToIssuesStatus={() => navigate('/issues/status')}
            />
          }
        />
        <Route
          path="/reunion/new"
          element={
            <NewReunionPage
              subjects={subjects}
              groups={groups}
              currentUserId={currentUser?.id ?? null}
              isSubmitting={isSubmitting}
              onBackToHomepage={() => navigate('/')}
              onOpenLogin={() => navigate('/auth')}
              onSubmit={handleSubmit}
            />
          }
        />
        <Route
          path="/student-groups"
          element={
            <StudentGroupsPage
              isAuthenticated={isAuthenticated}
              currentUserId={currentUser?.id ?? null}
              onBackToHomepage={() => navigate('/')}
              onOpenLogin={() => navigate('/auth')}
              onOpenStudentProfile={(studentId, studentGroupId) =>
                navigate(`/profiles/${studentId}?studentGroupId=${studentGroupId}`)
              }
            />
          }
        />
        <Route
          path="/profiles/:id"
          element={
            <PublicProfilePage
              isAuthenticated={isAuthenticated}
              onOpenLogin={() => navigate('/auth')}
              onBackToHomepage={() => navigate('/')}
            />
          }
        />
        <Route
          path="/reunion/:id"
          element={
            <ReunionDetailsPage
              reunion={selectedReunion}
              messages={selectedReunionMessages}
              isLoading={isDetailsLoading}
              isMessagesLoading={isMessagesLoading}
              pageError={detailsError}
              messageError={messageError}
              isJoining={isJoining}
              isSendingMessage={isSendingMessage}
              joinFeedback={joinFeedback}
              messageFeedback={messageFeedback}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUser?.id ?? null}
              onJoin={handleJoinReunion}
              onSendMessage={handleSendMessage}
              onOpenLogin={() => {
                navigate('/auth')
              }}
              onOpenParticipantProfile={(studentId) => {
                if (selectedReunionId) {
                  navigate(`/profiles/${studentId}?reunionId=${selectedReunionId}`)
                }
              }}
              onBackToHomepage={() => {
                navigate('/')
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer
        isAdmin={isAdmin}
        onOpenAbout={() => navigate('/about')}
        onOpenIssues={() => navigate('/issues')}
        onOpenIssueStatus={() => navigate('/issues/status')}
        onOpenNewsletter={() => navigate('/newsletter')}
        onOpenNewsletterAdmin={() => navigate('/newsletter/admin')}
      />
    </main>
  )
}

export default App
