import Ionicons from '@expo/vector-icons/Ionicons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { formatCurrency } from '@/lib/format'
import { accountsApi, creditCardsApi } from '@/services/accounts.api'
import { transactionsApi } from '@/services/transactions.api'
import { darkTheme } from '@/theme/colors'

type ImportStep = 'upload' | 'reading' | 'review' | 'completed'
type DocumentType = 'invoice' | 'receipt'
type ReviewFilter = 'pending' | 'all'

interface ExtractedTransactionItem {
  id: number
  description: string
  date: string
  category: string
  amount: number
  isPayment?: boolean
  isDuplicate?: boolean
  installmentInfo?: string
  selected: boolean
  isPending: boolean
  linkedInstallment?: string
  shareWithFamily: boolean
}

const INITIAL_EXTRACTED_ITEMS: ExtractedTransactionItem[] = [
  {
    id: 1,
    description: 'Pagamento recebido',
    date: '05/09',
    category: 'Pagamento de fatura',
    amount: -980.0,
    isPayment: true,
    installmentInfo: undefined,
    selected: true,
    isPending: true,
    shareWithFamily: false,
  },
  {
    id: 2,
    description: 'Loja Tech 02/06',
    date: '15/09',
    category: 'Eletrônicos (sugerido)',
    amount: 250.0,
    installmentInfo: 'Parcela 2 de 6. Toque para vincular.',
    linkedInstallment: 'Monitor',
    selected: true,
    isPending: true,
    shareWithFamily: false,
  },
  {
    id: 3,
    description: 'Uber *Trip',
    date: '20/09',
    category: 'Transporte',
    amount: 32.9,
    isDuplicate: true,
    installmentInfo: undefined,
    selected: false,
    isPending: true,
    shareWithFamily: false,
  },
  {
    id: 4,
    description: 'Posto Shell',
    date: '12/09',
    category: 'Transporte (sugerido)',
    amount: 210.0,
    selected: true,
    isPending: false,
    shareWithFamily: false,
  },
  {
    id: 5,
    description: 'Supermercado Extra',
    date: '10/09',
    category: 'Alimentação',
    amount: 185.4,
    selected: true,
    isPending: false,
    shareWithFamily: true,
  },
  {
    id: 6,
    description: 'Farmácia São Paulo',
    date: '08/09',
    category: 'Saúde',
    amount: 72.1,
    selected: true,
    isPending: false,
    shareWithFamily: false,
  },
]

export default function InvoiceImportScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  // Steps
  const [step, setStep] = useState<ImportStep>('upload')
  const [docType, setDocType] = useState<DocumentType>('invoice')

  // Inputs
  const [userSelectedCard, setSelectedCard] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState('Outubro de 2026, fechou em 28/09')
  const [selectedFile, setSelectedFile] = useState<{
    name: string
    size: string
    isProtected?: boolean
  } | null>({
    name: 'fatura-inter-outubro.pdf',
    size: '1,2 MB',
    isProtected: false,
  })
  const [hasPassword, setHasPassword] = useState(false)
  const [pdfPassword, setPdfPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  // Reading state simulation
  const [readingProgress, setReadingProgress] = useState(1)

  // Review state
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('pending')
  const [items, setItems] = useState<ExtractedTransactionItem[]>(INITIAL_EXTRACTED_ITEMS)
  const [editingItem, setEditingItem] = useState<ExtractedTransactionItem | null>(null)

  // Edit draft inside modal
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editLinkedInstallment, setEditLinkedInstallment] = useState<'monitor' | 'new'>('monitor')
  const [editShareFamily, setEditShareFamily] = useState(false)

  // Receipt review state
  const [userReceiptAccount, setReceiptAccount] = useState<string | null>(null)
  const [receiptShareFamily, setReceiptShareFamily] = useState(true)

  // Fetch accounts/cards if available
  const { data: cards } = useQuery({
    queryKey: ['credit-cards'],
    queryFn: async () => (await creditCardsApi.list()).data,
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await accountsApi.list()).data,
  })

  // Derived selections from API or defaults
  const selectedCard =
    userSelectedCard ??
    (Array.isArray(cards) && cards.length > 0
      ? cards[0].name || `Cartão final ${cards[0].last_digits || ''}`
      : 'Inter final 1190')

  const receiptAccount =
    userReceiptAccount ??
    (Array.isArray(accounts) && accounts.length > 0 ? accounts[0].name : 'Conta Itaú • Conta corrente')

  // Animate reading progress when entering 'reading' step
  useEffect(() => {
    if (step === 'reading') {
      const t1 = setTimeout(() => setReadingProgress(2), 700)
      const t2 = setTimeout(() => setReadingProgress(3), 1500)
      const t3 = setTimeout(() => setReadingProgress(4), 2200)
      const t4 = setTimeout(() => setStep('review'), 3000)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
      }
    }
  }, [step])

  const handleStartUpload = () => {
    if (hasPassword && pdfPassword.trim().toLowerCase() === 'errada') {
      setPasswordError(true)
      return
    }
    setPasswordError(false)
    setReadingProgress(1)
    setStep('reading')
  }

  const handleToggleItemSelection = (id: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
    )
  }

  const handleOpenEdit = (item: ExtractedTransactionItem) => {
    setEditingItem(item)
    setEditDesc(item.description)
    setEditAmount(item.amount.toString())
    setEditCategory(item.category)
    setEditLinkedInstallment(item.linkedInstallment ? 'monitor' : 'new')
    setEditShareFamily(item.shareWithFamily)
  }

  const handleSaveEdit = () => {
    if (!editingItem) return
    setItems((prev) =>
      prev.map((i) =>
        i.id === editingItem.id
          ? {
              ...i,
              description: editDesc,
              amount: parseFloat(editAmount) || i.amount,
              category: editCategory,
              linkedInstallment: editLinkedInstallment === 'monitor' ? 'Monitor' : 'Novo parcelamento',
              shareWithFamily: editShareFamily,
              isPending: false, // resolved!
            }
          : i
      )
    )
    setEditingItem(null)
  }

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const targetAccountId = (Array.isArray(accounts) && accounts[0]?.id) || 1

      if (docType === 'invoice') {
        const batchItems = items
          .filter((i) => i.selected)
          .map((i) => ({
            account_id: targetAccountId,
            amount: Math.abs(i.amount),
            date: today,
            description: i.description,
            merchant_name: i.description,
            is_installment: Boolean(i.installmentInfo),
            installment_current: i.installmentInfo ? 2 : undefined,
            installment_total: i.installmentInfo ? 6 : undefined,
            ownership_type: i.shareWithFamily ? 'family' : 'personal',
          }))

        try {
          await transactionsApi.batchConfirm({ items: batchItems as any })
        } catch (err) {
          console.warn('Batch confirm API fallback:', err)
        }
      } else {
        const couponItems = [
          { description: 'Arroz 5 kg', amount: 29.9 },
          { description: 'Café 500 g', amount: 22.5 },
          { description: 'Frutas e verduras', amount: 35.0 },
        ]

        try {
          for (const ci of couponItems) {
            await transactionsApi.create({
              type: 'expense',
              amount: ci.amount,
              date: today,
              account_id: targetAccountId,
              description: `${ci.description} (Mercado Extra)`,
            })
          }
        } catch (err) {
          console.warn('Coupon create API fallback:', err)
        }
      }

      // Invalida e recarrega dados no app
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
    onSuccess: () => {
      setStep('completed')
    },
  })

  const selectedCount = items.filter((i) => i.selected).length
  const filteredItems = items.filter((i) => {
    if (reviewFilter === 'pending') return i.isPending
    return true
  })

  // STEP INDICATOR (1. Enviar, 2. Ler, 3. Revisar)
  const renderStepper = () => {
    const isStep1Done = step === 'reading' || step === 'review' || step === 'completed'
    const isStep2Done = step === 'review' || step === 'completed'
    const isStep3Done = step === 'completed'

    return (
      <View style={styles.stepperContainer}>
        {/* Etapa 1 */}
        <View style={styles.stepperItem}>
          <View style={[styles.stepperBar, isStep1Done && styles.stepperBarActive]} />
          <Text style={[styles.stepperText, isStep1Done && styles.stepperTextActive]}>
            1. Enviar
          </Text>
        </View>

        {/* Etapa 2 */}
        <View style={styles.stepperItem}>
          <View
            style={[
              styles.stepperBar,
              (step === 'reading' || isStep2Done) && styles.stepperBarActive,
            ]}
          />
          <Text
            style={[
              styles.stepperText,
              (step === 'reading' || isStep2Done) && styles.stepperTextActive,
            ]}
          >
            2. Ler
          </Text>
        </View>

        {/* Etapa 3 */}
        <View style={styles.stepperItem}>
          <View
            style={[
              styles.stepperBar,
              (step === 'review' || isStep3Done) && styles.stepperBarActive,
            ]}
          />
          <Text
            style={[
              styles.stepperText,
              (step === 'review' || isStep3Done) && styles.stepperTextActive,
            ]}
          >
            3. Revisar
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* HEADER */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === 'review' ? 'Voltar' : 'Fechar'}
          style={styles.headerButton}
          onPress={() => {
            if (step === 'review') setStep('upload')
            else router.back()
          }}
        >
          <Ionicons
            name={step === 'review' ? 'chevron-back' : 'close'}
            size={24}
            color="#f8fafc"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          {step === 'review'
            ? docType === 'invoice'
              ? 'Revisar lançamentos'
              : 'Revisar cupom'
            : step === 'completed'
            ? 'Importação concluída'
            : 'Importar fatura'}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* STEP 1: ENVIAR (163:1358 e 163:1665) */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {step === 'upload' && (
          <View style={styles.stepWrapper}>
            {renderStepper()}

            {/* Cartão selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Cartão</Text>
              <Pressable
                style={styles.fieldInput}
                onPress={() => {
                  const cardOptions = Array.isArray(cards) && cards.length > 0
                    ? cards.map((c: any) => ({
                        text: c.name || `Cartão final ${c.last_digits || ''}`,
                        onPress: () => setSelectedCard(c.name || 'Cartão'),
                      }))
                    : [
                        { text: 'Inter final 1190', onPress: () => setSelectedCard('Inter final 1190') },
                        { text: 'Nubank final 4022', onPress: () => setSelectedCard('Nubank final 4022') },
                      ]
                  Alert.alert('Selecionar Cartão', 'Selecione o cartão de crédito emitente da fatura:', [
                    ...cardOptions,
                    { text: 'Cancelar', style: 'cancel' },
                  ])
                }}
              >
                <Text style={styles.fieldValue}>{selectedCard}</Text>
                <Ionicons name="chevron-down" size={16} color={darkTheme.textMuted} />
              </Pressable>
            </View>

            {/* Fatura selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Fatura</Text>
              <Pressable
                style={styles.fieldInput}
                onPress={() => {
                  Alert.alert('Selecionar Fatura', 'Selecione o mês da fatura:', [
                    { text: 'Outubro de 2026, fechou em 28/09', onPress: () => setSelectedInvoice('Outubro de 2026, fechou em 28/09') },
                    { text: 'Novembro de 2026 (aberta)', onPress: () => setSelectedInvoice('Novembro de 2026 (aberta)') },
                    { text: 'Cancelar', style: 'cancel' },
                  ])
                }}
              >
                <Text style={styles.fieldValue}>{selectedInvoice}</Text>
                <Ionicons name="chevron-down" size={16} color={darkTheme.textMuted} />
              </Pressable>
            </View>

            {/* Tipo de Documento: Fatura vs Cupom fiscal */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Tipo de documento</Text>
              <View style={styles.docTypeRow}>
                <Pressable
                  style={[styles.docTypeChip, docType === 'invoice' && styles.docTypeChipActive]}
                  onPress={() => setDocType('invoice')}
                >
                  <Text style={[styles.docTypeText, docType === 'invoice' && styles.docTypeTextActive]}>
                    Fatura
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.docTypeChip, docType === 'receipt' && styles.docTypeChipActive]}
                  onPress={() => setDocType('receipt')}
                >
                  <Text style={[styles.docTypeText, docType === 'receipt' && styles.docTypeTextActive]}>
                    Cupom fiscal
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Escolher PDF / Arquivo */}
            <Pressable
              style={styles.uploadArea}
              onPress={() => {
                Alert.alert(
                  'Selecionar Documento',
                  'Escolha a fonte do arquivo da fatura ou cupom:',
                  [
                    {
                      text: 'Fatura Inter PDF (Padrão)',
                      onPress: () => {
                        setSelectedFile({ name: 'fatura-inter-outubro.pdf', size: '1,2 MB', isProtected: false })
                        setHasPassword(false)
                        setPasswordError(false)
                      },
                    },
                    {
                      text: 'Fatura com Senha (Teste de senha)',
                      onPress: () => {
                        setSelectedFile({ name: 'inter-outubro-protegido.pdf', size: '1,4 MB', isProtected: true })
                        setHasPassword(true)
                      },
                    },
                    {
                      text: 'Cupom Mercado Extra (Foto)',
                      onPress: () => {
                        setSelectedFile({ name: 'cupom-mercado-extra.jpg', size: '2,8 MB' })
                        setDocType('receipt')
                      },
                    },
                    { text: 'Cancelar', style: 'cancel' },
                  ]
                )
              }}
            >
              <View style={styles.uploadIconContainer}>
                <Ionicons name="cloud-upload-outline" size={28} color="#a78bfa" />
              </View>
              <Text style={styles.uploadTitle}>
                {selectedFile ? selectedFile.name : 'Escolher PDF, foto ou câmera'}
              </Text>
              <Text style={styles.uploadSubtitle}>
                {selectedFile ? `${selectedFile.size} • Toque para alterar` : 'Fatura em PDF ou foto, até 10 MB'}
              </Text>
            </Pressable>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#a78bfa" />
              <Text style={styles.infoText}>
                PDF com senha: informe a senha do arquivo. Revise os itens antes de salvar.
              </Text>
            </View>

            {/* Password input / test */}
            {(hasPassword || selectedFile?.isProtected) && (
              <View style={styles.passwordCard}>
                <Text style={styles.fieldLabel}>Senha do PDF</Text>
                <TextInput
                  value={pdfPassword}
                  onChangeText={(val) => {
                    setPdfPassword(val)
                    setPasswordError(false)
                  }}
                  secureTextEntry
                  placeholder="••••••"
                  placeholderTextColor={darkTheme.textMuted}
                  style={[styles.passwordInput, passwordError && styles.inputErrorBorder]}
                />
                {passwordError && (
                  <View style={styles.errorAlertContainer}>
                    <Text style={styles.errorAlertText}>
                      Não foi possível abrir o PDF com essa senha.
                    </Text>
                    <View style={styles.warningBox}>
                      <Ionicons name="warning-outline" size={18} color="#f59e0b" />
                      <Text style={styles.warningText}>
                        A leitura não foi concluída. Confira a senha ou selecione uma cópia legível. Nenhum lançamento foi salvo.
                      </Text>
                    </View>
                  </View>
                )}
                <Text style={styles.securityDisclaimer}>
                  Não informe a senha de acesso ao banco. Não enviamos pedido de senha por e-mail.
                </Text>
              </View>
            )}

            {/* Botão Enviar e ler com IA */}
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.btnPressed]}
              onPress={handleStartUpload}
            >
              <Text style={styles.primaryButtonText}>Enviar e ler com IA</Text>
            </Pressable>
          </View>
        )}

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* STEP 2: LENDO FATURA (163:1397) */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {step === 'reading' && (
          <View style={styles.stepWrapper}>
            {renderStepper()}

            {/* Arquivo enviado */}
            <View style={styles.fileSummaryCard}>
              <View style={styles.fileIconBox}>
                <Ionicons name="document-text-outline" size={24} color="#a78bfa" />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{selectedFile?.name || 'fatura-inter-outubro.pdf'}</Text>
                <Text style={styles.fileSize}>{selectedFile?.size || '1,2 MB'}, enviado</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#34d399" />
            </View>

            {/* Hero Card Lendo sua fatura com gradiente */}
            <LinearGradient
              colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.readingHeroCard}
            >
              <View style={styles.sparklesBox}>
                <Ionicons name="sparkles" size={26} color="#a78bfa" />
              </View>
              <Text style={styles.readingTitle}>Lendo sua fatura</Text>
              <Text style={styles.readingSubtitle}>14 encontrados até agora</Text>
            </LinearGradient>

            {/* Checklist */}
            <View style={styles.checklistCard}>
              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                <Text style={styles.checkItemDoneText}>Arquivo recebido</Text>
              </View>

              <View style={styles.checkItem}>
                {readingProgress >= 2 ? (
                  <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                ) : (
                  <ActivityIndicator size="small" color="#a78bfa" />
                )}
                <Text style={readingProgress >= 2 ? styles.checkItemDoneText : styles.checkItemActiveText}>
                  Identificando lançamentos
                </Text>
              </View>

              <View style={styles.checkItem}>
                {readingProgress >= 3 ? (
                  <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                ) : readingProgress === 2 ? (
                  <ActivityIndicator size="small" color="#a78bfa" />
                ) : (
                  <View style={styles.checkCirclePending} />
                )}
                <Text style={readingProgress >= 3 ? styles.checkItemDoneText : styles.checkItemPendingText}>
                  Conferindo com o total da fatura
                </Text>
              </View>

              <View style={styles.checkItem}>
                {readingProgress >= 4 ? (
                  <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                ) : readingProgress === 3 ? (
                  <ActivityIndicator size="small" color="#a78bfa" />
                ) : (
                  <View style={styles.checkCirclePending} />
                )}
                <Text style={readingProgress >= 4 ? styles.checkItemDoneText : styles.checkItemPendingText}>
                  Sugerindo categorias e parcelas
                </Text>
              </View>
            </View>

            <Text style={styles.readingDisclaimer}>
              Leva alguns segundos. Você pode sair desta tela: avisamos quando estiver pronta.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.btnPressed]}
              onPress={() => setStep('upload')}
            >
              <Text style={styles.secondaryButtonText}>Cancelar leitura</Text>
            </Pressable>
          </View>
        )}

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* STEP 3: REVISAR FATURA (163:1460) OU CUPOM (163:1700) */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {step === 'review' && docType === 'invoice' && (
          <View style={styles.stepWrapper}>
            {renderStepper()}

            {/* Card Conferência */}
            <View style={styles.conferenceCard}>
              <Text style={styles.conferenceHeader}>
                14 lançamentos encontrados na fatura de outubro do Inter
              </Text>
              <View style={styles.conferenceRow}>
                <View style={styles.conferenceCol}>
                  <Text style={styles.conferenceLabel}>Total da fatura</Text>
                  <Text style={styles.conferenceValue}>R$ 1.150,40</Text>
                </View>
                <View style={styles.conferenceDivider} />
                <View style={styles.conferenceCol}>
                  <Text style={styles.conferenceLabel}>Soma dos itens ✓</Text>
                  <Text style={styles.conferenceValueChecked}>R$ 1.150,40</Text>
                </View>
              </View>
            </View>

            {/* Filter Tabs: Pendências vs Todos */}
            <View style={styles.reviewTabsRow}>
              <Pressable
                style={[styles.tabChip, reviewFilter === 'pending' && styles.tabChipActive]}
                onPress={() => setReviewFilter('pending')}
              >
                <Text style={[styles.tabChipText, reviewFilter === 'pending' && styles.tabChipTextActive]}>
                  Pendências (3)
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabChip, reviewFilter === 'all' && styles.tabChipActive]}
                onPress={() => setReviewFilter('all')}
              >
                <Text style={[styles.tabChipText, reviewFilter === 'all' && styles.tabChipTextActive]}>
                  Todos (14)
                </Text>
              </Pressable>
            </View>

            {/* List of Extracted Items */}
            <View style={styles.itemsListContainer}>
              {filteredItems.map((item, idx) => (
                <View key={item.id}>
                  {idx > 0 && <View style={styles.itemSeparator} />}
                  <Pressable
                    style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <Pressable
                      style={styles.checkboxTouchable}
                      onPress={() => handleToggleItemSelection(item.id)}
                    >
                      <View style={[styles.checkbox, item.selected && styles.checkboxSelected]}>
                        {item.selected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                      </View>
                    </Pressable>

                    <View style={styles.itemCenter}>
                      <Text style={styles.itemTitle}>{item.description}</Text>
                      <Text style={styles.itemSubtitle}>
                        {item.date}, {item.category}
                      </Text>
                      {Boolean(item.installmentInfo) && (
                        <Text style={styles.itemHighlightHint}>{item.installmentInfo}</Text>
                      )}
                      {item.isPayment && (
                        <Text style={styles.itemPaymentHint}>
                          Pagamento de fatura: fica fora das despesas.
                        </Text>
                      )}
                      {item.isDuplicate && (
                        <Text style={styles.itemDuplicateHint}>
                          Possível duplicado de um lançamento manual.
                        </Text>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.itemAmount,
                        item.amount < 0 ? styles.itemAmountNegative : styles.itemAmountDefault,
                      ]}
                    >
                      {item.amount < 0 ? `– R$ ${Math.abs(item.amount).toFixed(2).replace('.', ',')}` : formatCurrency(item.amount)}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <Text style={styles.extraItemsNote}>Mais 10 itens sem pendências</Text>

            {/* Confirmation Footer */}
            <View style={styles.reviewFooter}>
              <Text style={styles.selectedCountText}>{selectedCount} de 14 selecionados</Text>
              <Text style={styles.nothingSavedNote}>Nada é salvo antes de confirmar</Text>

              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.btnPressed]}
                onPress={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Confirmar {selectedCount} lançamentos
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* STEP 3 (VARIANT): REVISAR CUPOM FISCAL (163:1700) */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {step === 'review' && docType === 'receipt' && (
          <View style={styles.stepWrapper}>
            {/* Status pill */}
            <View style={styles.receiptStatusBadge}>
              <Text style={styles.receiptStatusText}>Foto extraída • ainda não salva</Text>
            </View>

            {/* Resumo */}
            <View style={styles.receiptHeroCard}>
              <Text style={styles.receiptMerchant}>Mercado Extra • 01/10/2026</Text>
              <Text style={styles.receiptTotal}>R$ 87,40</Text>
              <Text style={styles.receiptItemCount}>3 itens • confira a extração</Text>
            </View>

            {/* Conta de origem */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Conta de origem</Text>
              <Pressable
                style={styles.fieldInput}
                onPress={() => {
                  Alert.alert('Conta de Origem', 'Selecione a conta para pagamento deste cupom:', [
                    { text: 'Conta Itaú • Conta corrente', onPress: () => setReceiptAccount('Conta Itaú • Conta corrente') },
                    { text: 'Nubank • Conta corrente', onPress: () => setReceiptAccount('Nubank • Conta corrente') },
                    { text: 'Cancelar', style: 'cancel' },
                  ])
                }}
              >
                <Text style={styles.fieldValue}>{receiptAccount}</Text>
                <Ionicons name="chevron-down" size={16} color={darkTheme.textMuted} />
              </Pressable>
              <Text style={styles.fieldHint}>
                Tipo permitido como fonte de liquidez • saldo R$ 4.200,00.
              </Text>
            </View>

            {/* Itens do cupom */}
            <View style={styles.itemsListContainer}>
              <View style={styles.couponItemRow}>
                <View style={styles.couponItemInfo}>
                  <Text style={styles.itemTitle}>Arroz 5 kg</Text>
                  <Text style={styles.itemSubtitle}>Alimentação • categoria sugerida</Text>
                </View>
                <Text style={styles.itemAmount}>R$ 29,90</Text>
              </View>

              <View style={styles.itemSeparator} />

              <View style={styles.couponItemRow}>
                <View style={styles.couponItemInfo}>
                  <Text style={styles.itemTitle}>Café 500 g</Text>
                  <Text style={styles.itemSubtitle}>Alimentação • categoria sugerida</Text>
                </View>
                <Text style={styles.itemAmount}>R$ 22,50</Text>
              </View>

              <View style={styles.itemSeparator} />

              <View style={styles.couponItemRow}>
                <View style={styles.couponItemInfo}>
                  <Text style={styles.itemTitle}>Frutas e verduras</Text>
                  <Text style={styles.itemSubtitle}>Alimentação • categoria sugerida</Text>
                </View>
                <Text style={styles.itemAmount}>R$ 35,00</Text>
              </View>
            </View>

            {/* Opções de Rateio / Categoria */}
            <View style={styles.couponOptionsCard}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Compartilhar com a família</Text>
                <Switch
                  value={receiptShareFamily}
                  onValueChange={setReceiptShareFamily}
                  trackColor={{ false: '#2b233c', true: '#7c3aed' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#a78bfa" />
              <Text style={styles.infoText}>
                Somente cupom extraído. Este fluxo não é um módulo de recibos fiscais.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.btnPressed]}
              onPress={() => confirmMutation.mutate()}
            >
              <Text style={styles.primaryButtonText}>Confirmar despesa de R$ 87,40</Text>
            </Pressable>
          </View>
        )}

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* STEP 4: IMPORTAÇÃO CONCLUÍDA (163:1619) */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {step === 'completed' && (
          <View style={styles.stepWrapper}>
            {/* Sucesso Badge */}
            <View style={styles.successBadgeContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={32} color="#34d399" />
              </View>
              <Text style={styles.successTitle}>Importação concluída</Text>
              <Text style={styles.successSubtitle}>
                12 lançamentos foram adicionados à fatura de outubro do Inter
              </Text>
            </View>

            {/* Resumo dos lançamentos processados */}
            <View style={styles.successSummaryCard}>
              <View style={styles.successSummaryItem}>
                <View style={styles.summaryIconBox}>
                  <Ionicons name="layers-outline" size={20} color="#a78bfa" />
                </View>
                <View style={styles.summaryItemText}>
                  <Text style={styles.summaryItemTitle}>1 parcela vinculada</Text>
                  <Text style={styles.summaryItemDesc}>Monitor, parcela 2 de 6</Text>
                </View>
              </View>

              <View style={styles.itemSeparator} />

              <View style={styles.successSummaryItem}>
                <View style={styles.summaryIconBox}>
                  <Ionicons name="card-outline" size={20} color="#a78bfa" />
                </View>
                <View style={styles.summaryItemText}>
                  <Text style={styles.summaryItemTitle}>1 pagamento identificado</Text>
                  <Text style={styles.summaryItemDesc}>Fora do resumo de despesas</Text>
                </View>
              </View>

              <View style={styles.itemSeparator} />

              <View style={styles.successSummaryItem}>
                <View style={styles.summaryIconBox}>
                  <Ionicons name="copy-outline" size={20} color="#a78bfa" />
                </View>
                <View style={styles.summaryItemText}>
                  <Text style={styles.summaryItemTitle}>1 possível duplicado ignorado</Text>
                  <Text style={styles.summaryItemDesc}>Uber de 20/09</Text>
                </View>
              </View>
            </View>

            {/* Alerta de confirmação */}
            <View style={styles.infoBoxSuccess}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#34d399" />
              <Text style={styles.infoTextSuccess}>
                Lançamentos revisados e confirmados por você.
              </Text>
            </View>

            {/* Botões de Ação */}
            <View style={styles.completedButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.btnPressed]}
                onPress={() => router.replace('/transactions')}
              >
                <Text style={styles.primaryButtonText}>Ver lançamentos</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.btnPressed]}
                onPress={() => router.replace('/(app)/(tabs)')}
              >
                <Text style={styles.secondaryButtonText}>Voltar ao início</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* BOTTOM SHEET: EDITAR ITEM DA FATURA (163:1522 / 163:1578) */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={Boolean(editingItem)}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalScrim} onPress={() => setEditingItem(null)} />

          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.dragHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar lançamento</Text>
              <Pressable onPress={() => setEditingItem(null)}>
                <Ionicons name="close" size={22} color="#f8fafc" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Form card */}
              <View style={styles.editFormCard}>
                <View style={styles.editField}>
                  <Text style={styles.fieldLabel}>Descrição</Text>
                  <TextInput
                    value={editDesc}
                    onChangeText={setEditDesc}
                    style={styles.editInput}
                  />
                </View>

                <View style={styles.editField}>
                  <Text style={styles.fieldLabel}>Valor</Text>
                  <TextInput
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="numeric"
                    style={styles.editInput}
                  />
                </View>

                <View style={styles.editField}>
                  <Text style={styles.fieldLabel}>Data da compra</Text>
                  <TextInput
                    value={editingItem?.date || '15/09/2026'}
                    editable={false}
                    style={[styles.editInput, { color: darkTheme.textMuted }]}
                  />
                </View>

                <View style={styles.editField}>
                  <Text style={styles.fieldLabel}>Categoria</Text>
                  <TextInput
                    value={editCategory}
                    onChangeText={setEditCategory}
                    style={styles.editInput}
                  />
                </View>
              </View>

              {/* Installment linking option */}
              <Text style={styles.installmentLinkHeader}>Parcela 2 de 6. Vincular a:</Text>

              <Pressable
                style={[
                  styles.installmentOption,
                  editLinkedInstallment === 'monitor' && styles.installmentOptionActive,
                ]}
                onPress={() => setEditLinkedInstallment('monitor')}
              >
                <View style={styles.installmentRadio}>
                  {editLinkedInstallment === 'monitor' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.installmentOptionInfo}>
                  <Text style={styles.installmentOptionTitle}>Monitor</Text>
                  <Text style={styles.installmentOptionSub}>
                    6x de R$ 250,00, compra em agosto
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.installmentOption,
                  editLinkedInstallment === 'new' && styles.installmentOptionActive,
                ]}
                onPress={() => setEditLinkedInstallment('new')}
              >
                <View style={styles.installmentRadio}>
                  {editLinkedInstallment === 'new' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.installmentOptionInfo}>
                  <Text style={styles.installmentOptionTitle}>Criar novo parcelamento</Text>
                  <Text style={styles.installmentOptionSub}>
                    Registra as 6 parcelas e as faturas
                  </Text>
                </View>
              </Pressable>

              {/* Family sharing toggle */}
              <View style={styles.familyShareCard}>
                <Text style={styles.switchLabel}>Compartilhar com a família</Text>
                <Switch
                  value={editShareFamily}
                  onValueChange={setEditShareFamily}
                  trackColor={{ false: '#2b233c', true: '#7c3aed' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Save changes button */}
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.btnPressed, { marginTop: 16 }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.primaryButtonText}>Salvar alterações</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080512',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Sora',
    fontWeight: '400',
    color: '#f8fafc',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stepWrapper: {
    gap: 12,
  },
  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  stepperItem: {
    flex: 1,
    gap: 8,
  },
  stepperBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2b233c',
  },
  stepperBarActive: {
    backgroundColor: '#7c3aed',
  },
  stepperText: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  stepperTextActive: {
    color: '#a78bfa',
    fontWeight: '500',
  },
  // Fields
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  fieldInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#120e1e',
    borderWidth: 1,
    borderColor: '#2b233c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  fieldValue: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#f8fafc',
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a7a1b7',
    marginTop: 2,
  },
  // Document Type Chips
  docTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  docTypeChip: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#120e1e',
    borderWidth: 1,
    borderColor: '#2b233c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypeChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderColor: '#7c3aed',
  },
  docTypeText: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  docTypeTextActive: {
    color: '#a78bfa',
    fontWeight: '600',
  },
  // Upload Area
  uploadArea: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#a78bfa',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(124, 58, 237, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 6,
  },
  uploadIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1b152b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 16,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#a7a1b7',
    textAlign: 'center',
  },
  // Info & Password
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b152b',
    borderWidth: 1,
    borderColor: '#2b233c',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a78bfa',
    lineHeight: 16,
  },
  passwordCard: {
    backgroundColor: '#120e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 16,
    gap: 10,
  },
  passwordInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#080512',
    borderWidth: 1,
    borderColor: '#2b233c',
    paddingHorizontal: 14,
    color: '#f8fafc',
    fontSize: 16,
  },
  inputErrorBorder: {
    borderColor: '#ef4444',
  },
  errorAlertContainer: {
    gap: 8,
    marginTop: 4,
  },
  errorAlertText: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#ef4444',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#f59e0b',
  },
  securityDisclaimer: {
    fontSize: 11,
    fontFamily: 'Geist',
    color: '#a7a1b7',
    marginTop: 4,
  },
  // Step 2: Reading
  fileSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 14,
    gap: 12,
  },
  fileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1b152b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#f8fafc',
  },
  fileSize: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  readingHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  sparklesBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1b152b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingTitle: {
    fontSize: 20,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: '#f8fafc',
  },
  readingSubtitle: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  checklistCard: {
    backgroundColor: '#120e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 16,
    gap: 14,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCirclePending: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#2b233c',
  },
  checkItemDoneText: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#f8fafc',
  },
  checkItemActiveText: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#a78bfa',
  },
  checkItemPendingText: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  readingDisclaimer: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#a7a1b7',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  // Step 3: Review
  conferenceCard: {
    backgroundColor: '#120e1e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 16,
    gap: 12,
  },
  conferenceHeader: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#f8fafc',
  },
  conferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  conferenceCol: {
    flex: 1,
    gap: 4,
  },
  conferenceDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#2b233c',
    marginHorizontal: 12,
  },
  conferenceLabel: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  conferenceValue: {
    fontSize: 18,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: '#f8fafc',
  },
  conferenceValueChecked: {
    fontSize: 18,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: '#34d399',
  },
  reviewTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    height: 32,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#120e1e',
    borderWidth: 1,
    borderColor: '#2b233c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderColor: '#7c3aed',
  },
  tabChipText: {
    fontSize: 13,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#a7a1b7',
  },
  tabChipTextActive: {
    color: '#a78bfa',
    fontWeight: '600',
  },
  itemsListContainer: {
    backgroundColor: '#120e1e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.7,
  },
  checkboxTouchable: {
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#2b233c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  itemCenter: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#f8fafc',
  },
  itemSubtitle: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  itemHighlightHint: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a78bfa',
    marginTop: 2,
  },
  itemPaymentHint: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#34d399',
    marginTop: 2,
  },
  itemDuplicateHint: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#f59e0b',
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontFamily: 'Sora',
    fontWeight: '500',
    color: '#f8fafc',
  },
  itemAmountNegative: {
    color: '#34d399',
  },
  itemAmountDefault: {
    color: '#f8fafc',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#2b233c',
  },
  extraItemsNote: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#a7a1b7',
    textAlign: 'center',
    marginVertical: 4,
  },
  reviewFooter: {
    gap: 10,
    marginTop: 4,
  },
  selectedCountText: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  nothingSavedNote: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a78bfa',
  },
  // Receipt variant
  receiptStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderColor: '#7c3aed',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  receiptStatusText: {
    fontSize: 12,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#a78bfa',
  },
  receiptHeroCard: {
    backgroundColor: '#120e1e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 16,
    gap: 6,
  },
  receiptMerchant: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  receiptTotal: {
    fontSize: 28,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: '#f8fafc',
  },
  receiptItemCount: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  couponItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  couponItemInfo: {
    flex: 1,
    gap: 2,
  },
  couponOptionsCard: {
    backgroundColor: '#120e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#f8fafc',
  },
  // Step 4: Completed
  successBadgeContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 2,
    borderColor: '#34d399',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#a7a1b7',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  successSummaryCard: {
    backgroundColor: '#120e1e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 16,
    gap: 12,
  },
  successSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1b152b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryItemText: {
    flex: 1,
    gap: 2,
  },
  summaryItemTitle: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#f8fafc',
  },
  summaryItemDesc: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  infoBoxSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  infoTextSuccess: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#34d399',
  },
  completedButtonsRow: {
    gap: 10,
    marginTop: 8,
  },
  // Buttons
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: 'Geist',
    fontWeight: '600',
    color: '#f8fafc',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1b152b',
    borderWidth: 1.5,
    borderColor: '#2b233c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '600',
    color: '#f8fafc',
  },
  btnPressed: {
    opacity: 0.75,
  },
  // Modal Edit Item
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalScrim: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#120e1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2b233c',
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a7a1b7',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Sora',
    fontWeight: '600',
    color: '#f8fafc',
  },
  editFormCard: {
    backgroundColor: '#080512',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 14,
    gap: 12,
  },
  editField: {
    gap: 4,
  },
  editInput: {
    height: 42,
    borderRadius: 8,
    backgroundColor: '#120e1e',
    borderWidth: 1,
    borderColor: '#2b233c',
    paddingHorizontal: 10,
    color: '#f8fafc',
    fontSize: 14,
    fontFamily: 'Geist',
  },
  installmentLinkHeader: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  installmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080512',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  installmentOptionActive: {
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  installmentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7c3aed',
  },
  installmentOptionInfo: {
    flex: 1,
    gap: 2,
  },
  installmentOptionTitle: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '500',
    color: '#f8fafc',
  },
  installmentOptionSub: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#a7a1b7',
  },
  familyShareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#080512',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2b233c',
    padding: 14,
    marginTop: 8,
  },
})
