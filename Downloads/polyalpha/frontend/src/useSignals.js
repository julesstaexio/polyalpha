import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient.js'

export function useSignals() {
  const [userId, setUserId] = useState(null)
  const [signals, setSignals]   = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchSignals = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setSignals(data || [])

      const resolved = (data || []).filter(s => s.resolved)
      const wins     = resolved.filter(s => s.result === 'WIN')
      const pnls     = resolved.filter(s => s.pnl !== null).map(s => s.pnl)

      setStats({
        total:    (data || []).length,
        resolved: resolved.length,
        wins:     wins.length,
        losses:   resolved.filter(s => s.result === 'LOSS').length,
        winRate:  resolved.length > 0 ? Math.round(wins.length / resolved.length * 100) : null,
        avgPnl:   pnls.length > 0 ? Math.round(pnls.reduce((a,b)=>a+b,0) / pnls.length) : null,
        totalPnl: pnls.length > 0 ? Math.round(pnls.reduce((a,b)=>a+b,0)) : null,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchSignals() }, [fetchSignals])

  const saveSignal = useCallback(async (market, analysis) => {
    if (!userId) return null
    const gap = Math.abs(analysis.aiProb - market.polyProb)
    const { data, error } = await supabase
      .from('signals')
      .insert({
        user_id:     userId,
        market_id:   market.id,
        market_slug: market.slug || market.id,
        question:    market.question,
        category:    market.category,
        end_date:    market.endDate,
        poly_prob:   market.polyProb,
        ai_prob:     analysis.aiProb,
        gap,
        signal:      analysis.signal,
        verdict:     analysis.verdict,
        confidence:  analysis.confidence,
        edge:        analysis.edge,
      })
      .select()
      .single()

    if (error) { console.error('saveSignal:', error); return null }
    setSignals(prev => [data, ...prev])
    return data
  }, [userId])

  const resolveSignal = useCallback(async (signalId, result, finalProb) => {
    const signal = signals.find(s => s.id === signalId)
    if (!signal) return
    const pnl = finalProb != null
      ? signal.signal === 'LONG'
        ? Math.round((finalProb - signal.poly_prob) / signal.poly_prob * 100)
        : Math.round((signal.poly_prob - finalProb) / signal.poly_prob * 100)
      : null

    const { data, error } = await supabase
      .from('signals')
      .update({ resolved: true, result, final_prob: finalProb, pnl })
      .eq('id', signalId)
      .select()
      .single()

    if (error) { console.error('resolveSignal:', error); return }
    setSignals(prev => prev.map(s => s.id === signalId ? data : s))
    fetchSignals()
  }, [signals, fetchSignals])

  return { signals, stats, loading, error, saveSignal, resolveSignal, refresh: fetchSignals }
}
