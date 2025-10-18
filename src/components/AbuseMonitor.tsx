/**
 * Componente de monitoramento de abuso (apenas para admins)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { abuseDetector } from '@/services/AbuseDetector';
import { AlertTriangle, Shield, Users, Activity, RefreshCw } from 'lucide-react';

export function AbuseMonitor() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    throttledUsers: 0,
    suspiciousUsers: 0,
    totalAnomalies: 0,
    actionsInLastHour: 0
  });
  const [loading, setLoading] = useState(false);

  const loadStats = () => {
    setLoading(true);
    try {
      const statistics = abuseDetector.getStatistics();
      setStats(statistics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Atualiza a cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSuspicionLevel = (count: number) => {
    if (count === 0) return { label: 'Normal', variant: 'default' as const };
    if (count < 3) return { label: 'Baixo', variant: 'secondary' as const };
    if (count < 10) return { label: 'Médio', variant: 'default' as const };
    return { label: 'Alto', variant: 'destructive' as const };
  };

  const suspicionLevel = getSuspicionLevel(stats.suspiciousUsers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoramento de Segurança</h2>
          <p className="text-muted-foreground">
            Detecção de padrões suspeitos e prevenção de abuso
          </p>
        </div>
        <Button
          onClick={loadStats}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Alertas */}
      {stats.suspiciousUsers > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Usuários Suspeitos Detectados</AlertTitle>
          <AlertDescription>
            Há {stats.suspiciousUsers} usuário(s) com padrão de comportamento suspeito.
            Revise os logs para mais detalhes.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuários ativos na última hora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Throttled
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.throttledUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuários temporariamente bloqueados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suspeitos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.suspiciousUsers}
              <Badge variant={suspicionLevel.variant}>
                {suspicionLevel.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Score de suspeita elevado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ações
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.actionsInLastHour}</div>
            <p className="text-xs text-muted-foreground">
              Total de ações na última hora
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card de Anomalias */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Anomalias</CardTitle>
          <CardDescription>
            Total de {stats.totalAnomalies} anomalia(s) detectada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.totalAnomalies === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma anomalia detectada</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Anomalias detectadas nas últimas 24 horas. 
                Use o console do navegador para ver detalhes completos.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Abuse Detector Export:', abuseDetector.export());
                }}
              >
                Exportar Logs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
