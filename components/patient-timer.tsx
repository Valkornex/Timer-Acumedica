"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bell,
  Play,
  Pause,
  RotateCcw,
  X,
  Syringe,
  Heart,
  Plus,
  Trash2,
  Clock,
  AlarmClock,
  CheckCircle,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Alert } from "@/lib/supabase"

type Patient = {
  id: number
  name: string
  bed: string
  timerRunning: boolean
  timeElapsed: number
  sessionDuration: number
}

type AlertType = "needles" | "pulse" | "session"

type PatientTimerProps = {
  patient: Patient
  updatePatient: (id: number, data: Partial<Patient>) => void
  addAlert: (type: AlertType, minutesFromNow: number) => void
  getPendingAlerts: (type: AlertType) => Alert[]
  activeAlerts: Alert[]
  dismissAlert: (alert: Alert) => void
  deleteAlert: (alertId: string) => void
}

export default function PatientTimer({
  patient,
  updatePatient,
  addAlert,
  getPendingAlerts,
  activeAlerts,
  dismissAlert,
  deleteAlert,
}: PatientTimerProps) {
  const [sessionInput, setSessionInput] = useState("")
  const [needlesAlertInput, setNeedlesAlertInput] = useState("")
  const [pulseAlertInput, setPulseAlertInput] = useState("")

  const pendingNeedlesAlerts = getPendingAlerts("needles")
  const pendingPulseAlerts = getPendingAlerts("pulse")

  const hasSessionAlert = activeAlerts.some((alert) => alert.type === "session")

  const setSessionDuration = () => {
    const minutes = Number.parseInt(sessionInput)
    if (!isNaN(minutes) && minutes > 0) {
      updatePatient(patient.id, {
        sessionDuration: minutes * 60,
      })
      setSessionInput("")
    }
  }

  const startTimer = () => {
    updatePatient(patient.id, { timerRunning: true })
  }

  const pauseTimer = () => {
    updatePatient(patient.id, { timerRunning: false })
  }

  const resetTimer = () => {
    updatePatient(patient.id, {
      timerRunning: false,
      timeElapsed: 0,
      sessionDuration: 0,
    })
    setSessionInput("")
  }

  const setNeedlesAlert = () => {
    const minutes = Number.parseInt(needlesAlertInput)
    if (!isNaN(minutes) && minutes > 0) {
      addAlert("needles", minutes)
      setNeedlesAlertInput("")
    }
  }

  const setPulseAlert = () => {
    const minutes = Number.parseInt(pulseAlertInput)
    if (!isNaN(minutes) && minutes > 0) {
      addAlert("pulse", minutes)
      setPulseAlertInput("")
    }
  }

  // Quick add common alert times
  const quickAddAlert = (type: AlertType, minutes: number) => {
    addAlert(type, minutes)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatRemainingTime = (triggerAt: number) => {
    const remaining = triggerAt - patient.timeElapsed
    if (remaining <= 0) return "Acum"

    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60

    if (mins > 0) {
      return `în ${mins}m ${secs}s`
    } else {
      return `în ${secs}s`
    }
  }

  const timeRemaining = patient.sessionDuration > 0 ? Math.max(0, patient.sessionDuration - patient.timeElapsed) : 0
  const progressPercentage =
    patient.sessionDuration > 0 ? Math.min(100, (patient.timeElapsed / patient.sessionDuration) * 100) : 0

  const isSessionComplete = patient.sessionDuration > 0 && patient.timeElapsed >= patient.sessionDuration

  return (
    <Card className="w-full border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <Clock className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <span className="text-xl font-bold text-blue-900">{patient.name}</span>
              <span className="text-sm text-blue-600 ml-2 font-medium">({patient.bed})</span>
            </div>
          </div>
          <div className="flex gap-2">
            {activeAlerts.map((alert, index) => {
              let buttonClass = ""
              let icon = null

              if (alert.type === "needles") {
                buttonClass = "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                icon = <Syringe className="h-4 w-4" />
              } else if (alert.type === "pulse") {
                buttonClass = "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                icon = <Heart className="h-4 w-4" />
              } else if (alert.type === "session") {
                buttonClass = "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                icon = <CheckCircle className="h-4 w-4" />
              }

              return (
                <Button
                  key={index}
                  variant={alert.type === "needles" ? "destructive" : "default"}
                  size="sm"
                  onClick={() => dismissAlert(alert)}
                  className={`flex items-center gap-1 ${buttonClass} text-white shadow-md hover:shadow-lg transition-all duration-200`}
                >
                  {icon}
                  <X className="h-4 w-4" />
                </Button>
              )
            })}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-0">
        {/* Timer Display */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">Timp Scurs</div>
              <div className="text-3xl font-mono font-bold tabular-nums text-blue-800">
                {formatTime(patient.timeElapsed)}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">Rămas</div>
              <div
                className={`text-3xl font-mono font-bold tabular-nums ${isSessionComplete ? "text-green-600" : "text-blue-800"}`}
              >
                {patient.sessionDuration > 0 ? formatTime(timeRemaining) : "--:--"}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {patient.sessionDuration > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className={`h-2.5 rounded-full ${
                    isSessionComplete
                      ? "bg-gradient-to-r from-green-400 to-green-600"
                      : "bg-gradient-to-r from-blue-400 to-blue-600"
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="text-sm text-center text-gray-500 mt-3">
            {isSessionComplete ? (
              <span className="inline-flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                Sesiune finalizată
              </span>
            ) : patient.timerRunning ? (
              <span className="inline-flex items-center text-green-600">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Sesiune în desfășurare
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
                Sesiune în pauză
              </span>
            )}
          </div>
        </div>

        {/* Session Duration Setting */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <Label htmlFor={`session-${patient.id}`} className="text-gray-700 font-medium flex items-center gap-2">
            <AlarmClock className="h-4 w-4 text-blue-600" />
            <span>Durata Sesiunii (minute)</span>
          </Label>
          <div className="flex mt-2">
            <Input
              id={`session-${patient.id}`}
              type="number"
              min="1"
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              className="mr-2 border-blue-200 focus:border-blue-400"
              placeholder="Introduceți minutele"
            />
            <Button
              onClick={setSessionDuration}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              Setează
            </Button>
          </div>
        </div>

        {/* Alerts Tabs */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <Tabs defaultValue="needles">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger
                value="needles"
                className="flex items-center gap-1 data-[state=active]:bg-red-100 data-[state=active]:text-red-700 data-[state=active]:shadow-md"
              >
                <Syringe className="h-4 w-4" />
                <span>Ace</span>
                {pendingNeedlesAlerts.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-red-200 text-red-700">
                    {pendingNeedlesAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="pulse"
                className="flex items-center gap-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-md"
              >
                <Heart className="h-4 w-4" />
                <span>Puls</span>
                {pendingPulseAlerts.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-blue-200 text-blue-700">
                    {pendingPulseAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="needles" className="space-y-4 mt-2">
              <div>
                <Label
                  htmlFor={`needles-alert-${patient.id}`}
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Bell className="h-4 w-4 text-red-600" />
                  <span>Schimbă Acele În (minute)</span>
                </Label>
                <div className="flex mt-2">
                  <Input
                    id={`needles-alert-${patient.id}`}
                    type="number"
                    min="1"
                    value={needlesAlertInput}
                    onChange={(e) => setNeedlesAlertInput(e.target.value)}
                    className="mr-2 border-red-200 focus:border-red-400"
                    placeholder="Introduceți minutele"
                  />
                  <Button
                    onClick={setNeedlesAlert}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Setează
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Adaugă Rapid:</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => quickAddAlert("needles", 5)}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Plus className="h-3 w-3 mr-1" /> 5m
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => quickAddAlert("needles", 10)}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Plus className="h-3 w-3 mr-1" /> 10m
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => quickAddAlert("needles", 15)}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Plus className="h-3 w-3 mr-1" /> 15m
                  </Button>
                </div>
              </div>

              {pendingNeedlesAlerts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-600">Schimbări de Ace Programate:</div>
                  <div className="space-y-2">
                    {pendingNeedlesAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex justify-between items-center text-sm p-3 bg-red-50 border border-red-100 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center">
                          <Syringe className="h-4 w-4 mr-2 text-red-600" />
                          <span className="font-medium text-red-800">La {formatTime(alert.trigger_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                            {formatRemainingTime(alert.trigger_at)}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
                                  onClick={() => deleteAlert(alert.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Șterge alertă</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pulse" className="space-y-4 mt-2">
              <div>
                <Label
                  htmlFor={`pulse-alert-${patient.id}`}
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span>Verifică Pulsul În (minute)</span>
                </Label>
                <div className="flex mt-2">
                  <Input
                    id={`pulse-alert-${patient.id}`}
                    type="number"
                    min="1"
                    value={pulseAlertInput}
                    onChange={(e) => setPulseAlertInput(e.target.value)}
                    className="mr-2 border-blue-200 focus:border-blue-400"
                    placeholder="Introduceți minutele"
                  />
                  <Button
                    onClick={setPulseAlert}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Setează
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Adaugă Rapid:</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => quickAddAlert("pulse", 5)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="h-3 w-3 mr-1" /> 5m
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => quickAddAlert("pulse", 10)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="h-3 w-3 mr-1" /> 10m
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => quickAddAlert("pulse", 15)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="h-3 w-3 mr-1" /> 15m
                  </Button>
                </div>
              </div>

              {pendingPulseAlerts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-600">Verificări Puls Programate:</div>
                  <div className="space-y-2">
                    {pendingPulseAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex justify-between items-center text-sm p-3 bg-blue-50 border border-blue-100 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium text-blue-800">La {formatTime(alert.trigger_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                            {formatRemainingTime(alert.trigger_at)}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                  onClick={() => deleteAlert(alert.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Șterge alertă</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between px-0 pt-4">
        {!patient.timerRunning ? (
          <Button
            onClick={startTimer}
            className="flex-1 mr-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        ) : (
          <Button
            onClick={pauseTimer}
            variant="outline"
            className="flex-1 mr-2 border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <Pause className="mr-2 h-4 w-4" />
            Pauză
          </Button>
        )}
        <Button
          onClick={resetTimer}
          variant="outline"
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Resetare
        </Button>
      </CardFooter>
    </Card>
  )
}

