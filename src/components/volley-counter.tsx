
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Undo2,
  Redo2,
  Play,
  Pause,
  TimerReset,
  Trophy,
  RotateCcw,
  Settings,
  HelpCircle,
  Mic,
  Expand,
  Minimize,
} from 'lucide-react';
import { useHistory } from '@/hooks/use-history';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSettings } from '@/contexts/settings-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type SetScore = { teamAScore: number; teamBScore: number; winner?: 'A' | 'B' };

type MatchState = {
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  currentSet: number;
  sets: SetScore[];
};

const initialMatchState: MatchState = {
  teamAName: 'Casa',
  teamBName: 'Visitante',
  teamAScore: 0,
  teamBScore: 0,
  currentSet: 1,
  sets: [],
};

const SETS_TO_WIN = 3;

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function VolleyCounter() {
  const {
    state,
    set: setMatchState,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
  } = useHistory(initialMatchState);

  const { settings } = useSettings();
  const [seconds, setSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [animatedScore, setAnimatedScore] = useState<'A' | 'B' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const { teamAWinsSet, teamBWinsSet, isSetOver } = useMemo(() => {
    const { teamAScore, teamBScore, currentSet } = state;
    const pointsToWin = currentSet === (SETS_TO_WIN * 2 - 1) ? settings.tieBreakPoints : settings.pointsToWin;
    const teamAWins =
      teamAScore >= pointsToWin && teamAScore >= teamBScore + 2;
    const teamBWins =
      teamBScore >= pointsToWin && teamBScore >= teamAScore + 2;
    return { teamAWinsSet: teamAWins, teamBWinsSet: teamBWins, isSetOver: teamAWins || teamBWins };
  }, [state, settings.pointsToWin, settings.tieBreakPoints]);

  const { teamASetsWon, teamBSetsWon, isMatchOver, winner } = useMemo(() => {
    const teamASets = state.sets.filter(s => s.winner === 'A').length;
    const teamBSets = state.sets.filter(s => s.winner === 'B').length;
    const matchWinner = teamASets === SETS_TO_WIN ? 'A' : teamBSets === SETS_TO_WIN ? 'B' : null;
    return {
        teamASetsWon: teamASets,
        teamBSetsWon: teamBSets,
        isMatchOver: !!matchWinner,
        winner: matchWinner
    };
  }, [state.sets]);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && !isMatchOver && !isSetOver) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, isMatchOver, isSetOver]);
  
    useEffect(() => {
      if (isSetOver) {
          setIsTimerActive(false);
      }
  }, [isSetOver]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

  const handleScoreChange = useCallback((team: 'A' | 'B', delta: number) => {
    if (isMatchOver || isSetOver) return;

    setMatchState((prev) => {
      const currentScore = team === 'A' ? prev.teamAScore : prev.teamBScore;
      if (currentScore + delta < 0) return prev;
      return {
        ...prev,
        [team === 'A' ? 'teamAScore' : 'teamBScore']: currentScore + delta,
      };
    });

    setAnimatedScore(team);
    setTimeout(() => setAnimatedScore(null), 300);
  }, [isMatchOver, isSetOver, setMatchState]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return; 
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        if (transcript.includes('casa ponto')) {
            handleScoreChange('A', 1);
            toast({ title: 'Ponto para Casa!' });
        } else if (transcript.includes('visitante ponto')) {
            handleScoreChange('B', 1);
            toast({ title: 'Ponto para Visitante!' });
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setIsListening(false);
            toast({
                variant: 'destructive',
                title: 'Permissão para microfone negada.',
                description: "Por favor, habilite o acesso ao microfone nas configurações do seu navegador."
            });
        }
    };
    
    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Could not restart recognition", e);
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
    };
}, [handleScoreChange, isListening, toast]);


  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
        toast({
            variant: "destructive",
            title: "Navegador incompatível",
            description: "Seu navegador não suporta comandos de voz.",
        });
        return;
    }

    setIsListening(prevState => {
      const nextState = !prevState;
      if (nextState) {
        try {
          recognition.start();
          toast({
            title: "Comandos de voz ativados!",
            description: 'Diga "Casa ponto" ou "Visitante ponto".',
          });
        } catch (e) {
          console.error("Speech recognition could not be started", e);
          return false;
        }
      } else {
        recognition.stop();
        toast({ title: "Comandos de voz desativados." });
      }
      return nextState;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            toast({
                variant: "destructive",
                title: "Não foi possível entrar em tela cheia",
                description: `Seu navegador pode não suportar esta funcionalidade ou a permissão foi negada.`,
            });
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  const handleFinishSet = useCallback(() => {
    if (!isSetOver) return;

    setMatchState(prev => {
        const newSet = { teamAScore: prev.teamAScore, teamBScore: prev.teamBScore, winner: teamAWinsSet ? 'A' : 'B' as 'A' | 'B' };
        const newSets = [...prev.sets, newSet];
        
        return {
            ...prev,
            sets: newSets,
            currentSet: prev.currentSet + 1,
            teamAScore: 0,
            teamBScore: 0,
        }
    });
    setIsTimerActive(true);
  }, [isSetOver, teamAWinsSet, setMatchState]);

  const prevIsSetOverRef = useRef<boolean>();
  useEffect(() => {
    prevIsSetOverRef.current = isSetOver;
  });
  const prevIsSetOver = prevIsSetOverRef.current;

  useEffect(() => {
    if (!prevIsSetOver && isSetOver && !isMatchOver) {
      toast({
        title: "Set Finalizado!",
        description: `${teamAWinsSet ? state.teamAName : state.teamBName} venceu o set ${state.currentSet}.`,
        action: <ToastAction altText="Iniciar Próximo Set" onClick={handleFinishSet}>Iniciar Próximo Set</ToastAction>,
        duration: 1000 * 60 * 60, // 1 hour
      });
    }
  }, [prevIsSetOver, isSetOver, isMatchOver, teamAWinsSet, state.teamAName, state.teamBName, state.currentSet, toast, handleFinishSet]);

  const handleNameChange = (team: 'A' | 'B', name: string) => {
    setMatchState((prev) => ({
      ...prev,
      [team === 'A' ? 'teamAName' : 'teamBName']: name,
    }));
  };

  const resetMatch = () => {
    resetHistory(initialMatchState);
    setSeconds(0);
    setIsTimerActive(false);
    toast({
      title: 'Partida Resetada',
      description: 'Todos os placares, sets e o cronômetro foram resetados.',
    });
  };

  const ScoreDisplay = ({ team }: { team: 'A' | 'B' }) => {
    const score = team === 'A' ? state.teamAScore : state.teamBScore;
    const name = team === 'A' ? state.teamAName : state.teamBName;
    const setsWon = team === 'A' ? teamASetsWon : teamBSetsWon;

    const handleContainerClick = () => {
        handleScoreChange(team, 1)
    }
    
    const handleContainerContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        handleScoreChange(team, -1);
    }

    return (
      <Card className={cn(
          "flex h-full w-full flex-col overflow-hidden shadow-lg",
          team === 'A' ? "bg-card-a" : "bg-card-b"
        )}>
        <CardHeader className="p-4">
            <div className="flex items-baseline justify-between gap-2">
                <Input
                    value={name}
                    onChange={(e) => handleNameChange(team, e.target.value)}
                    className="h-auto flex-grow border-0 bg-transparent p-0 text-left text-xl font-semibold focus-visible:ring-1 focus-visible:ring-offset-0 md:text-2xl"
                    aria-label={`Nome do Time ${team}`}
                    disabled={isMatchOver}
                />
                <p className="whitespace-nowrap text-sm font-normal text-muted-foreground select-none">Sets: {setsWon}</p>
            </div>
        </CardHeader>
        <CardContent 
            className="flex flex-grow cursor-pointer flex-col items-center justify-center p-4"
            onClick={handleContainerClick}
            onContextMenu={handleContainerContextMenu}
            role="button"
            aria-label={`Placar para ${name}. Toque para adicionar ponto, segure ou clique com o botão direito para remover.`}
        >
          <div
            className={cn(
              'select-none text-[clamp(6rem,22vw,24rem)] leading-none font-black font-headline transition-all duration-300 ease-out',
              team === 'A' ? 'text-team-a-fg' : 'text-team-b-fg',
              animatedScore === team && 'scale-110'
            )}
            style={{ lineHeight: 0.8 }}
          >
            {score}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (isMatchOver) {
    return (
        <div className="flex flex-grow items-center justify-center">
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 p-4 md:p-8">
                <Card className="w-full animate-in fade-in zoom-in-95 p-8 text-center shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-4xl font-black text-primary select-none">Fim de Jogo!</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <Trophy className="h-24 w-24 text-primary" />
                        <p className={cn("text-2xl font-bold select-none", winner === 'A' ? 'text-team-a-fg' : 'text-team-b-fg')}>
                            {winner === 'A' ? state.teamAName : state.teamBName} venceu a partida!
                        </p>
                        <p className="text-lg text-muted-foreground select-none">
                            Placar final: {teamASetsWon} - {teamBSetsWon}
                        </p>
                    </CardContent>
                    <CardFooter className="justify-center">
                         <Button onClick={resetMatch} size="lg">
                            <RotateCcw className="mr-2 h-5 w-5" /> Nova Partida
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-grow flex-col items-stretch">
        <div className="grid w-full flex-grow grid-cols-5 grid-rows-1 gap-2 p-2 md:gap-4 md:p-4 lg:gap-6 lg:p-8">
            <div className="col-span-2 row-span-1">
                <ScoreDisplay team="A" />
            </div>
            
            <div className="col-span-1 row-span-1">
                <Card className="flex h-full w-full flex-col items-stretch text-center shadow-lg">
                    <CardHeader className="p-4">
                        <CardDescription className="uppercase tracking-widest select-none">Set</CardDescription>
                        <CardTitle className="font-black text-5xl select-none">{state.currentSet}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-4">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="font-mono text-2xl font-bold select-none" aria-label="Cronômetro da Partida">{formatTime(seconds)}</div>
                            <div className="flex items-center justify-center gap-2">
                                <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsTimerActive(!isTimerActive)}
                                aria-label={isTimerActive ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
                                >
                                {isTimerActive ? <Pause /> : <Play />}
                                </Button>
                                <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSeconds(0)}
                                aria-label="Resetar cronômetro"
                                >
                                <TimerReset />
                                </Button>
                            </div>
                        </div>
                        <div className="flex w-full items-center justify-center gap-2">
                            <Button onClick={undo} disabled={!canUndo} variant="outline" size="icon" aria-label="Desfazer">
                            <Undo2 />
                            </Button>
                            <Button onClick={redo} disabled={!canRedo} variant="outline" size="icon" aria-label="Refazer">
                            <Redo2 />
                            </Button>
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" aria-label="Resetar Partida">
                                <RotateCcw />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle className="select-none">Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription className="select-none">
                                    Isso irá resetar a partida inteira, incluindo todos os placares, nomes dos times e o cronômetro. Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={resetMatch}>Confirmar Reset</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <div className="flex w-full items-center justify-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button asChild variant="outline" size="icon" aria-label="Configurações">
                                            <Link href="/settings">
                                                <Settings />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="select-none">Configurações</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={toggleFullscreen}
                                            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
                                        >
                                            {isFullscreen ? <Minimize /> : <Expand />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="select-none">{isFullscreen ? 'Sair da Tela Cheia' : 'Entrar em Tela Cheia'}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={toggleListening}
                                            aria-label={isListening ? 'Desativar comandos de voz' : 'Ativar comandos de voz'}
                                            className={cn(isListening && 'border-destructive text-destructive animate-pulse')}
                                        >
                                            <Mic />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="select-none">Comandos de voz</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Ajuda">
                                        <HelpCircle />
                                    </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p className="select-none">Toque no placar para adicionar um ponto.</p>
                                    <p className="select-none">Segure ou clique direito para remover.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </CardContent>
                     {state.sets.length > 0 && (
                        <>
                            <div className="h-[1px] bg-border mx-4" />
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="select-none">Histórico</CardTitle>
                            </CardHeader>
                            <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 pt-0">
                                {state.sets.map((set, index) => (
                                    <div key={index} className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                                        <div className="font-semibold select-none">Set {index + 1}</div>
                                        <div className="flex items-center gap-2 text-lg select-none">
                                            <span className={cn("font-bold", set.winner === 'A' ? "text-primary" : "text-team-a-fg")}>{set.teamAScore}</span>
                                            <span className="text-muted-foreground">-</span>
                                            <span className={cn("font-bold", set.winner === 'B' ? "text-primary" : "text-team-b-fg")}>{set.teamBScore}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
            
            <div className="col-span-2 row-span-1">
                <ScoreDisplay team="B" />
            </div>
        </div>
    </div>
  );
}

    
