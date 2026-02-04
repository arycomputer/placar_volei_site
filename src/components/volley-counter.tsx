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
    if (isTimerActive && !isMatchOver) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, isMatchOver]);
  
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

  const handleScoreChange = (team: 'A' | 'B', delta: number) => {
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
  };

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
                <p className="whitespace-nowrap text-sm font-normal text-muted-foreground">Sets: {setsWon}</p>
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
              'font-headline font-black text-9xl leading-none transition-all duration-300 ease-out md:text-[12rem] lg:text-[16rem]',
              team === 'A' ? 'text-team-a-fg' : 'text-team-b-fg',
              animatedScore === team && 'scale-110'
            )}
          >
            {score}
          </div>
          <p className="mt-2 select-none text-xs text-muted-foreground">Toque para adicionar, segure para remover</p>
        </CardContent>
      </Card>
    );
  };
  
  if (isMatchOver) {
    return (
        <main className="flex min-h-screen items-center justify-center">
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 p-4 md:p-8">
                <Card className="w-full animate-in fade-in zoom-in-95 p-8 text-center shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-4xl font-black text-primary">Fim de Jogo!</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <Trophy className="h-24 w-24 text-primary" />
                        <p className={cn("text-2xl font-bold", winner === 'A' ? 'text-team-a-fg' : 'text-team-b-fg')}>
                            {winner === 'A' ? state.teamAName : state.teamBName} venceu a partida!
                        </p>
                        <p className="text-lg text-muted-foreground">
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
        </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-stretch">
        <div className="flex w-full flex-grow flex-col items-stretch gap-4 p-4 md:flex-row md:gap-6 md:p-8">
            <div className="flex flex-1 flex-col">
                <ScoreDisplay team="A" />
            </div>
            
            <div className="order-first flex w-full flex-col md:order-none md:w-[20%]">
                <Card className="flex h-full w-full flex-col items-stretch text-center shadow-lg">
                    <CardHeader className="p-4">
                        <CardDescription className="uppercase tracking-widest">Set</CardDescription>
                        <CardTitle className="font-black text-5xl">{state.currentSet}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="font-mono text-2xl font-bold" aria-label="Cronômetro da Partida">{formatTime(seconds)}</div>
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
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Isso irá resetar a partida inteira, incluindo todos os placares, nomes dos times e o cronômetro. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={resetMatch}>Confirmar Reset</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                        <Button asChild variant="outline" size="icon" aria-label="Configurações">
                        <Link href="/settings">
                            <Settings />
                        </Link>
                        </Button>
                    </div>
                    </CardContent>
                     {state.sets.length > 0 && (
                        <>
                            <div className="h-[1px] bg-border mx-4" />
                            <CardHeader className="p-4 pb-2">
                                <CardTitle>Histórico</CardTitle>
                            </CardHeader>
                            <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 pt-0">
                                {state.sets.map((set, index) => (
                                    <div key={index} className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                                        <div className="font-semibold">Set {index + 1}</div>
                                        <div className="flex items-center gap-2 text-lg">
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
            
            <div className="flex flex-1 flex-col">
                <ScoreDisplay team="B" />
            </div>
        </div>
    </main>
  );
}
