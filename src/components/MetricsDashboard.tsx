/**
 * MetricsDashboard - Dashboard completo de métricas do sistema
 * Exibe performance, uso de APIs, cache, recursos e filas
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { metricsCollector } from '@/services/MetricsCollector';
import { requestQueue } from '@/services/RequestQueue';
import { healthCheckService } from '@/services/HealthCheckService';
import { Activity, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle2, Server, Zap, Database } from 'lucide-react';

export function MetricsDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadMetrics = () => {
      setSummary(metricsCollector.getSummary());
      setQueueStats(requestQueue.getStats());
      
      // Get health status from all providers
      const status: Record<string, any> = {};
      ['did', 'elevenlabs', 'deepgram', 'openai'].forEach(provider => {
        const health = healthCheckService.getProviderHealth(provider as any);
        status[provider] = {
          status: health.status,
          lastCheck: health.lastCheck,
          latency: health.avgLatency,
          errorRate: health.failCount / Math.max(health.successCount + health.failCount, 1),
          lastError: health.lastError
        };
      });
      setHealthStatus(status);
    };

    loadMetrics();
    const interval = setInterval(() => {
      loadMetrics();
      setRefreshKey(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'text-success';
    if (percentage < 80) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthBadge = (status: string) => {
    if (status === 'healthy') return <Badge variant="default" className="bg-success"><CheckCircle2 className="w-3 h-3 mr-1" />Saudável</Badge>;
    if (status === 'degraded') return <Badge variant="secondary" className="bg-warning"><AlertTriangle className="w-3 h-3 mr-1" />Degradado</Badge>;
    return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Crítico</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
          <p className="text-muted-foreground">Monitoramento em tempo real do sistema</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Atualizado {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="queue">Fila</TabsTrigger>
          <TabsTrigger value="health">Saúde</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Chamadas</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.apis.totalCalls}</div>
                <p className="text-xs text-muted-foreground">
                  Taxa de sucesso: {(summary.apis.successRate * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.apis.averageLatency}ms</div>
                <p className="text-xs text-muted-foreground">
                  Última hora
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(summary.cache.hitRate * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {summary.cache.totalHits} hits / {summary.cache.totalMisses} misses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fila de Requisições</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{queueStats?.queueSize || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {queueStats?.processing || 0} processando
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Geral</CardTitle>
              <CardDescription>Métricas de performance das últimas operações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Taxa de Sucesso</span>
                  <span className="text-sm font-medium">{(summary.performance.successRate * 100).toFixed(1)}%</span>
                </div>
                <Progress value={summary.performance.successRate * 100} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Duração Média</span>
                  <span className="text-sm font-medium">{summary.performance.avgDuration}ms</span>
                </div>
                <Progress value={Math.min((summary.performance.avgDuration / 5000) * 100, 100)} />
              </div>

              {summary.performance.slowOperations.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Operações Lentas</p>
                  <div className="space-y-2">
                    {summary.performance.slowOperations.map((op: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{op.operation}</span>
                        <Badge variant="secondary">{op.duration}ms</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* APIs Tab */}
        <TabsContent value="apis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(summary.apis.byProvider).map(([provider, stats]: [string, any]) => (
              <Card key={provider}>
                <CardHeader>
                  <CardTitle className="capitalize">{provider}</CardTitle>
                  <CardDescription>{stats.calls} chamadas na última hora</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Latência Média</span>
                      <span className="text-sm font-medium">{stats.avgLatency}ms</span>
                    </div>
                    <Progress value={Math.min((stats.avgLatency / 3000) * 100, 100)} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Taxa de Erro</span>
                      <span className={`text-sm font-medium ${getStatusColor((stats.errors / stats.calls) * 100)}`}>
                        {((stats.errors / stats.calls) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={(stats.errors / stats.calls) * 100}
                      className="bg-muted"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Total de Erros</span>
                    <Badge variant={stats.errors > 0 ? "destructive" : "default"}>
                      {stats.errors}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Cache</CardTitle>
              <CardDescription>Performance do sistema de cache</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Hit Rate</p>
                  <p className="text-3xl font-bold text-success">{(summary.cache.hitRate * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Hits</p>
                  <p className="text-3xl font-bold">{summary.cache.totalHits}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Misses</p>
                  <p className="text-3xl font-bold">{summary.cache.totalMisses}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Eficiência do Cache</span>
                  <span className="text-sm font-medium">{(summary.cache.hitRate * 100).toFixed(1)}%</span>
                </div>
                <Progress value={summary.cache.hitRate * 100} />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Tamanho do Cache</p>
                <p className="text-2xl font-bold">{(summary.cache.size / 1024).toFixed(2)} KB</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fila de Requisições</CardTitle>
              <CardDescription>Status da fila de processamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Requisições na Fila</p>
                  <p className="text-3xl font-bold">{queueStats?.queueSize || 0}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Processando Agora</p>
                  <p className="text-3xl font-bold">{queueStats?.processing || 0}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium">Por Prioridade</p>
                {queueStats?.byPriority && Object.entries(queueStats.byPriority).map(([priority, count]: [string, any]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{priority}</span>
                    <Badge variant={priority === 'high' ? 'destructive' : priority === 'medium' ? 'secondary' : 'default'}>
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium">Por Tipo</p>
                {queueStats?.byType && Object.entries(queueStats.byType).map(([type, count]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>

              {queueStats?.pendingBatches && (
                <div className="space-y-3 pt-4 border-t">
                  <p className="text-sm font-medium">Batches Pendentes</p>
                  {Object.entries(queueStats.pendingBatches).map(([type, count]: [string, any]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {healthStatus && Object.entries(healthStatus).map(([provider, status]: [string, any]) => (
              <Card key={provider}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{provider}</CardTitle>
                    {getHealthBadge(status.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Última Verificação</span>
                    <span className="text-sm">
                      {new Date(status.lastCheck).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Latência</span>
                    <Badge variant="outline">{status.latency}ms</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taxa de Erro</span>
                    <Badge variant={status.errorRate > 0.1 ? "destructive" : "default"}>
                      {(status.errorRate * 100).toFixed(1)}%
                    </Badge>
                  </div>

                  {status.lastError && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Último Erro</p>
                      <p className="text-xs text-destructive">{status.lastError}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
