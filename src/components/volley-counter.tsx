"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Minus,
  Undo2,
  Redo2,
  Play,
  Pause,
  TimerReset,
  Trophy,
  Swords,
  RotateCcw,
} from 'lucide-react';
import { useHistory } from '@/hooks/use-history';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog"

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
  const [seconds, setSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [animatedScore, setAnimatedScore] = useState<'A' | 'B' | null>(null);
  const { toast } = useToast();

  const { teamAWinsSet, teamBWinsSet, isSetOver } = useMemo(() => {
    const { teamAScore, teamBScore, currentSet } = state;
    const pointsToWin = currentSet === 5 ? 15 : 25;
    const teamAWins =
      teamAScore >= pointsToWin && teamAScore >= teamBScore + 2;
    const teamBWins =
      teamBScore >= pointsToWin && teamBScore >= teamAScore + 2;
    return { teamAWinsSet: teamAWins, teamBWinsSet: teamBWins, isSetOver: teamAWins || teamBWins };
  }, [state]);

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

  const handleFinishSet = () => {
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

    toast({
        title: `Set ${state.currentSet} Finalizado!`,
        description: `${teamAWinsSet ? state.teamAName : state.teamBName} venceu o set.`,
      });
  }

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

    return (
      <Card className="flex flex-col w-full shadow-lg overflow-hidden">
        <CardHeader className="p-4">
            <div className="flex items-baseline justify-between gap-2">
                <Input
                    value={name}
                    onChange={(e) => handleNameChange(team, e.target.value)}
                    className="flex-grow text-xl md:text-2xl font-semibold text-left border-0 focus-visible:ring-1 focus-visible:ring-offset-0 bg-transparent p-0 h-auto"
                    aria-label={`Nome do Time ${team}`}
                    disabled={isMatchOver}
                />
                <p className="text-muted-foreground text-sm font-normal whitespace-nowrap">Sets: {setsWon}</p>
            </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center p-4">
          <div
            className={cn(
              'font-black font-headline transition-all duration-300 ease-out text-8xl md:text-7xl lg:text-8xl',
              animatedScore === team && 'scale-110 text-primary'
            )}
          >
            {score}
          </div>
        </CardContent>
        <CardFooter className="p-4 bg-muted/50 grid grid-cols-2 gap-2">
          <Button
            size="lg"
            onClick={() => handleScoreChange(team, 1)}
            disabled={isMatchOver || isSetOver}
            aria-label={`Adicionar ponto para ${name}`}
          >
            <Plus className="h-6 w-6" />
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => handleScoreChange(team, -1)}
            disabled={isMatchOver || isSetOver}
            aria-label={`Remover ponto de ${name}`}
          >
            <Minus className="h-6 w-6" />
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  if (isMatchOver) {
    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
            <Card className="w-full text-center p-8 shadow-2xl animate-in fade-in zoom-in-95">
                <CardHeader>
                    <CardTitle className="text-4xl font-black text-primary">Fim de Jogo!</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Trophy className="w-24 h-24 text-primary" />
                    <p className="text-2xl font-bold">
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
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 md:gap-6">
      <div className="grid grid-cols-1 md:grid-cols-[9fr_2fr_9fr] items-start gap-4 md:gap-8">
        <ScoreDisplay team="A" />
        
        <div className="flex flex-col gap-4 items-center justify-start h-full w-full order-first md:order-none">
            <div className="text-center font-bold text-muted-foreground text-xl">
                <div className="uppercase tracking-widest">Set</div>
                <div className="text-5xl font-black text-foreground">{state.currentSet}</div>
            </div>

            <Card className="shadow-lg w-full">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <div className="font-mono text-2xl font-bold" aria-label="Cronômetro da Partida">{formatTime(seconds)}</div>
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsTimerActive(!isTimerActive)}
                        aria-label={isTimerActive ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
                        >
                        {isTimerActive ? (
                            <Pause />
                        ) : (
                            <Play />
                        )}
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
                    <div className="flex items-center justify-center gap-2 w-full">
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
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <ScoreDisplay team="B" />
      </div>

      {isSetOver && (
        <Card className="p-4 text-center bg-primary/10 border-primary shadow-lg animate-in fade-in-50">
          <CardContent className="p-0 flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="font-bold text-lg text-primary-foreground bg-primary rounded-full px-4 py-1">Set Point!</p>
            <p className="text-primary font-semibold">{teamAWinsSet ? state.teamAName : state.teamBName} venceu o set.</p>
            <Button onClick={handleFinishSet}>
                Iniciar Próximo Set
            </Button>
          </CardContent>
        </Card>
      )}
      
      {state.sets.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Histórico de Sets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {state.sets.map((set, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                    <div className="font-semibold">Set {index + 1}</div>
                    <div className="flex items-center gap-2 text-lg">
                        <span className={cn("font-bold", set.winner === 'A' && "text-primary")}>{set.teamAScore}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className={cn("font-bold", set.winner === 'B' && "text-primary")}>{set.teamBScore}</span>
                    </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
