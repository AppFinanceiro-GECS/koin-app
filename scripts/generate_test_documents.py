#!/usr/bin/env python3
"""
Gera documentos de teste realistas para validação End-to-End do Koin:
1. fatura_nubank_outubro_2026.pdf (Fatura de cartão aberta)
2. fatura_protegida_inter_1234.pdf (Fatura protegida com senha '1234')
3. cupom_fiscal_supermercado.png (NFC-e de supermercado com múltiplos itens)
4. comprovante_pix_restaurante.png (Comprovante PIX digital)
5. comprovante_pagamento_boleto.pdf (Comprovante de pagamento de boleto)
"""

import os
from pathlib import Path
import pymupdf
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "test-documents"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def generate_fatura_nubank():
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)  # A4

    # Top Purple Banner
    purple = (130 / 255, 10 / 255, 209 / 255)
    dark_gray = (50 / 255, 50 / 255, 50 / 255)
    light_gray = (245 / 255, 245 / 255, 248 / 255)
    border_gray = (220 / 255, 220 / 255, 225 / 255)

    page.draw_rect(pymupdf.Rect(0, 0, 595, 90), color=purple, fill=purple)
    page.insert_text((40, 55), "Nu", fontsize=32, color=(1, 1, 1), fontname="helv")
    page.insert_text((100, 45), "Fatura de Cartão de Crédito", fontsize=18, color=(1, 1, 1), fontname="helv")
    page.insert_text((100, 68), "Outubro de 2026 • Fechada em 24/10/2026", fontsize=11, color=(0.9, 0.9, 0.9), fontname="helv")

    # Cardholder Info Box
    page.draw_rect(pymupdf.Rect(40, 110, 555, 195), color=border_gray, fill=light_gray)
    page.insert_text((55, 132), "TITULAR DA CONTA", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((55, 150), "Magic Space", fontsize=13, color=dark_gray, fontname="helv")
    page.insert_text((55, 172), "Cartão Nubank Mastercard Gold final 4821", fontsize=10, color=(0.4, 0.4, 0.4), fontname="helv")

    page.insert_text((240, 132), "VENCIMENTO", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((240, 153), "04/11/2026", fontsize=14, color=purple, fontname="helv")

    page.insert_text((380, 132), "TOTAL DA FATURA", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((380, 156), "R$ 1.847,90", fontsize=18, color=purple, fontname="helv")
    page.insert_text((380, 176), "Pagamento mínimo: R$ 277,18", fontsize=9, color=(0.4, 0.4, 0.4), fontname="helv")

    # Section Title: Transações
    page.insert_text((40, 230), "Lançamentos na sua fatura", fontsize=14, color=dark_gray, fontname="helv")
    page.draw_line(pymupdf.Point(40, 240), pymupdf.Point(555, 240), color=purple, width=1.5)

    # Table Header
    page.insert_text((45, 258), "DATA", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((115, 258), "ESTABELECIMENTO / DESCRIÇÃO", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((345, 258), "CATEGORIA", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((480, 258), "VALOR (R$)", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.draw_line(pymupdf.Point(40, 268), pymupdf.Point(555, 268), color=border_gray, width=0.5)

    items = [
        ("26/09", "Pão de Açúcar Mercado", "Alimentação", "342,50"),
        ("28/09", "Uber *Trip 0928", "Transporte", "38,90"),
        ("02/10", "Droga Raia Farmácia", "Saúde", "85,20"),
        ("04/10", "Pagamento recebido via PIX", "Pagamento", "-1.250,00"),
        ("05/10", "Netflix Mensalidade", "Assinatura", "55,90"),
        ("10/10", "Restaurante Outback", "Alimentação", "210,00"),
        ("12/10", "Posto Shell Combustível", "Transporte", "180,00"),
        ("15/10", "Magazine Luiza (02/05)", "Compras", "280,00"),
        ("18/10", "Spotify Premium Familiar", "Assinatura", "34,90"),
        ("20/10", "Amazon.com.br Marketplace", "Compras", "620,50"),
    ]

    y = 290
    for idx, (dt, desc, cat, val) in enumerate(items):
        if idx % 2 == 1:
            page.draw_rect(pymupdf.Rect(40, y - 14, 555, y + 10), color=None, fill=(0.98, 0.98, 1.0))
        page.insert_text((45, y), dt, fontsize=10, color=dark_gray, fontname="helv")
        page.insert_text((115, y), desc, fontsize=10, color=dark_gray, fontname="helv")
        page.insert_text((345, y), cat, fontsize=9, color=(0.4, 0.4, 0.4), fontname="helv")
        
        is_neg = val.startswith("-")
        col = (0.1, 0.6, 0.2) if is_neg else dark_gray
        page.insert_text((490, y), val, fontsize=10, color=col, fontname="helv")
        y += 26

    # Barcode section at bottom
    page.draw_rect(pymupdf.Rect(40, 680, 555, 780), color=border_gray, fill=light_gray)
    page.insert_text((55, 705), "Pague pelo aplicativo ou internet banking:", fontsize=10, color=dark_gray, fontname="helv")
    page.insert_text((55, 725), "26090.11111 22222.333333 44444.555555 6 98760000184790", fontsize=11, color=purple, fontname="helv")
    page.insert_text((55, 750), "Autenticação digital: NU-2026-B817-4920-EE10-KOIN-TEST", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")

    path = OUTPUT_DIR / "fatura_nubank_outubro_2026.pdf"
    doc.save(str(path))
    doc.close()
    print(f"Gerado: {path}")

def generate_fatura_inter_protegida():
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)

    orange = (255 / 255, 122 / 255, 0 / 255)
    dark_gray = (50 / 255, 50 / 255, 50 / 255)
    light_gray = (250 / 255, 248 / 255, 245 / 255)
    border_gray = (230 / 255, 225 / 255, 220 / 255)

    # Header
    page.draw_rect(pymupdf.Rect(0, 0, 595, 90), color=orange, fill=orange)
    page.insert_text((40, 55), "inter", fontsize=32, color=(1, 1, 1), fontname="helv")
    page.insert_text((140, 45), "Fatura de Cartão de Crédito", fontsize=18, color=(1, 1, 1), fontname="helv")
    page.insert_text((140, 68), "Setembro de 2026 • Fechada em 28/09/2026", fontsize=11, color=(1, 1, 1), fontname="helv")

    # Card info box
    page.draw_rect(pymupdf.Rect(40, 110, 555, 195), color=border_gray, fill=light_gray)
    page.insert_text((55, 132), "TITULAR", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((55, 150), "Magic Space", fontsize=13, color=dark_gray, fontname="helv")
    page.insert_text((55, 172), "Cartão Inter Mastercard Black final 1190", fontsize=10, color=(0.4, 0.4, 0.4), fontname="helv")

    page.insert_text((240, 132), "VENCIMENTO", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((240, 153), "08/10/2026", fontsize=14, color=orange, fontname="helv")

    page.insert_text((380, 132), "VALOR TOTAL", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((380, 156), "R$ 945,80", fontsize=18, color=orange, fontname="helv")
    page.insert_text((380, 176), "Limite total: R$ 8.000,00", fontsize=9, color=(0.4, 0.4, 0.4), fontname="helv")

    # Table Title
    page.insert_text((40, 230), "Transações do período", fontsize=14, color=dark_gray, fontname="helv")
    page.draw_line(pymupdf.Point(40, 240), pymupdf.Point(555, 240), color=orange, width=1.5)

    # Table Header
    page.insert_text((45, 258), "DATA", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((115, 258), "DESCRIÇÃO", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((345, 258), "CATEGORIA", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text((480, 258), "VALOR (R$)", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")
    page.draw_line(pymupdf.Point(40, 268), pymupdf.Point(555, 268), color=border_gray, width=0.5)

    items = [
        ("02/09", "Mercado Livre *Eletro", "Compras", "320,00"),
        ("10/09", "Ifood *Restaurante Japones", "Alimentação", "112,50"),
        ("14/09", "Kalunga Material Escritório", "Outros", "89,90"),
        ("19/09", "Smart Fit Mensalidade", "Saúde", "119,90"),
        ("22/09", "Posto Ipiranga", "Transporte", "150,00"),
        ("25/09", "Padaria Santo Pão", "Alimentação", "53,50"),
        ("27/09", "Farmácia Pacheco", "Saúde", "100,00"),
    ]

    y = 290
    for idx, (dt, desc, cat, val) in enumerate(items):
        if idx % 2 == 1:
            page.draw_rect(pymupdf.Rect(40, y - 14, 555, y + 10), color=None, fill=(1.0, 0.98, 0.95))
        page.insert_text((45, y), dt, fontsize=10, color=dark_gray, fontname="helv")
        page.insert_text((115, y), desc, fontsize=10, color=dark_gray, fontname="helv")
        page.insert_text((345, y), cat, fontsize=9, color=(0.4, 0.4, 0.4), fontname="helv")
        page.insert_text((490, y), val, fontsize=10, color=dark_gray, fontname="helv")
        y += 28

    # Bottom notes
    page.insert_text((40, 750), "Este arquivo é protegido por senha criptografada (Senha: 1234)", fontsize=9, color=(0.5, 0.5, 0.5), fontname="helv")

    path = OUTPUT_DIR / "fatura_protegida_inter_1234.pdf"
    # Salvar com senha '1234'
    doc.save(
        str(path),
        encryption=pymupdf.PDF_ENCRYPT_AES_256,
        user_pw="1234",
        owner_pw="koin_owner_pass",
    )
    doc.close()
    print(f"Gerado (com senha '1234'): {path}")

def generate_cupom_fiscal_png():
    # Criar uma imagem vertical tipo bobina térmica de mercado
    width, height = 650, 1100
    img = Image.new("RGB", (width, height), color=(252, 252, 250))
    draw = ImageDraw.Draw(img)

    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 20)
        font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 16)
        font_normal = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 15)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 13)
    except:
        font_large = font_medium = font_normal = font_small = ImageFont.load_default()

    text_color = (30, 30, 30)

    lines = [
        ("PÃO DE AÇÚCAR", font_large, True),
        ("COMPANHIA BRASILEIRA DE DISTRIBUIÇÃO", font_normal, True),
        ("CNPJ: 47.508.411/0001-56   IE: 112.004.550.110", font_small, True),
        ("AV. BRIGADEIRO LUIS ANTONIO, 3126 - SÃO PAULO/SP", font_small, True),
        ("-" * 52, font_normal, True),
        ("DANFE NFC-e - Documento Auxiliar da Nota Fiscal", font_medium, True),
        ("de Consumidor Eletrônica", font_medium, True),
        ("Não permite aproveitamento de crédito de ICMS", font_small, True),
        ("-" * 52, font_normal, True),
    ]

    y = 30
    for text, font, center in lines:
        if center:
            bbox = draw.textbbox((0, 0), text, font=font)
            w = bbox[2] - bbox[0]
            draw.text(((width - w) // 2, y), text, font=font, fill=text_color)
        else:
            draw.text((30, y), text, font=font, fill=text_color)
        y += 24

    # Table header
    draw.text((30, y), "#  CÓDIGO    DESCRIÇÃO         QTD  UN   VL UNIT  TOTAL", font=font_small, fill=text_color)
    y += 20
    draw.text((30, y), "-" * 52, font=font_normal, fill=text_color)
    y += 22

    items = [
        ("001", "7891001", "LEITE INTEGRAL 1L", "4", "UN", "4,99", "19,96"),
        ("002", "7892002", "ARROZ BRANCO 5KG", "1", "UN", "28,90", "28,90"),
        ("003", "7893003", "FEIJÃO CARIOCA 1KG", "2", "UN", "7,90", "15,80"),
        ("004", "7894004", "CAFÉ TORRADO 500G", "1", "UN", "18,90", "18,90"),
        ("005", "7895005", "BANANA PRATA KG", "1.2", "KG", "7,92", "9,50"),
    ]

    for item in items:
        line1 = f"{item[0]} {item[1]:<10} {item[2]:<18}"
        line2 = f"    {item[3]} {item[4]} x {item[5]:>6}                       {item[6]:>7}"
        draw.text((30, y), line1, font=font_normal, fill=text_color)
        y += 20
        draw.text((30, y), line2, font=font_normal, fill=text_color)
        y += 26

    draw.text((30, y), "-" * 52, font=font_normal, fill=text_color)
    y += 25

    draw.text((30, y), "QTD. TOTAL DE ITENS:", font=font_medium, fill=text_color)
    draw.text((500, y), "5", font=font_medium, fill=text_color)
    y += 28

    draw.text((30, y), "VALOR TOTAL R$:", font=font_large, fill=(10, 10, 10))
    draw.text((450, y), "93,06", font=font_large, fill=(10, 10, 10))
    y += 35

    draw.text((30, y), "FORMA DE PAGAMENTO:", font=font_normal, fill=text_color)
    y += 22
    draw.text((30, y), "Cartão de Crédito Mastercard", font=font_normal, fill=text_color)
    draw.text((450, y), "93,06", font=font_normal, fill=text_color)
    y += 35

    draw.text((30, y), "-" * 52, font=font_normal, fill=text_color)
    y += 25

    draw.text((30, y), "EMISSÃO: 10/11/2026 14:32:10 - Via Consumidor", font=font_small, fill=(80, 80, 80))
    y += 20
    draw.text((30, y), "Protocolo de Autorização: 135260098712345", font=font_small, fill=(80, 80, 80))
    y += 20
    draw.text((30, y), "Chave de Acesso:", font=font_small, fill=(80, 80, 80))
    y += 18
    draw.text((30, y), "3526 1147 5084 1100 0156 6500 1000 0123 4510 9876 5432", font=font_small, fill=(40, 40, 40))
    y += 35

    # Simulated barcode lines
    for i in range(40, width - 40, 6):
        thickness = 2 if (i % 12 == 0 or i % 18 == 0) else 1
        draw.line([(i, y), (i, y + 45)], fill=(40, 40, 40), width=thickness)

    path = OUTPUT_DIR / "cupom_fiscal_supermercado.png"
    img.save(str(path))
    print(f"Gerado: {path}")

def generate_comprovante_pix_png():
    width, height = 600, 850
    # App dark theme style receipt
    bg_color = (18, 14, 30)  # #120e1e
    surface_color = (27, 21, 43)  # #1b152b
    accent_green = (52, 211, 153)  # #34d399
    text_white = (248, 250, 252)
    text_muted = (167, 161, 183)

    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
        font_amount = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34)
        font_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
        font_value = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
    except:
        font_title = font_amount = font_value = font_label = font_small = ImageFont.load_default()

    # Card background
    draw.rounded_rectangle([30, 30, width - 30, height - 30], radius=16, fill=surface_color, outline=(43, 35, 60), width=1)

    # Header
    y = 60
    header_text = "Comprovante de Transferência PIX"
    bbox = draw.textbbox((0, 0), header_text, font=font_title)
    w = bbox[2] - bbox[0]
    draw.text(((width - w) // 2, y), header_text, font=font_title, fill=text_white)

    y += 45
    amount_text = "R$ 68,50"
    bbox = draw.textbbox((0, 0), amount_text, font=font_amount)
    w = bbox[2] - bbox[0]
    draw.text(((width - w) // 2, y), amount_text, font=font_amount, fill=accent_green)

    y += 50
    date_text = "10 de Novembro de 2026 - 13:15:22"
    bbox = draw.textbbox((0, 0), date_text, font=font_label)
    w = bbox[2] - bbox[0]
    draw.text(((width - w) // 2, y), date_text, font=font_label, fill=text_muted)

    y += 40
    draw.line([(50, y), (width - 50, y)], fill=(50, 42, 70), width=1)
    y += 30

    details = [
        ("Quem recebeu", ""),
        ("Nome", "Restaurante Sabores de Minas Ltda"),
        ("CNPJ", "12.345.678/0001-90"),
        ("Instituição", "Banco Nu Pagamentos S.A."),
        ("Chave PIX", "contato@saboresdeminas.com.br"),
        ("", ""),
        ("Quem pagou", ""),
        ("Nome", "Magic Space"),
        ("Instituição", "Banco Inter S.A."),
        ("Conta", "Agência 0001 • Conta 123456-7"),
        ("", ""),
        ("ID da Transação", "E00416968202611101315e0921a8f9c2"),
        ("Autenticação", "8F9C.21A0.E45B.77D1.9022.KOIN"),
    ]

    for label, val in details:
        if not label and not val:
            y += 10
            continue
        if not val:
            draw.text((60, y), label, font=font_title, fill=text_white)
            y += 28
            continue
        draw.text((60, y), label, font=font_label, fill=text_muted)
        draw.text((60, y + 18), val, font=font_value, fill=text_white)
        y += 44

    path = OUTPUT_DIR / "comprovante_pix_restaurante.png"
    img.save(str(path))
    print(f"Gerado: {path}")

def generate_comprovante_boleto():
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)

    navy = (20 / 255, 40 / 255, 80 / 255)
    dark_gray = (50 / 255, 50 / 255, 50 / 255)
    light_gray = (245 / 255, 247 / 255, 250 / 255)
    border_gray = (210 / 255, 215 / 255, 225 / 255)

    page.draw_rect(pymupdf.Rect(0, 0, 595, 80), color=navy, fill=navy)
    page.insert_text((40, 50), "Comprovante de Pagamento de Título", fontsize=20, color=(1, 1, 1), fontname="helv")

    page.draw_rect(pymupdf.Rect(40, 110, 555, 180), color=border_gray, fill=light_gray)
    page.insert_text((60, 135), "VALOR DO DOCUMENTO", fontsize=9, color=(0.4, 0.4, 0.5), fontname="helv")
    page.insert_text((60, 160), "R$ 450,00", fontsize=22, color=navy, fontname="helv")

    page.insert_text((320, 135), "DATA DO PAGAMENTO", fontsize=9, color=(0.4, 0.4, 0.5), fontname="helv")
    page.insert_text((320, 160), "08/11/2026", fontsize=16, color=dark_gray, fontname="helv")

    page.insert_text((40, 220), "Dados do Beneficiário e Pagador", fontsize=14, color=dark_gray, fontname="helv")
    page.draw_line(pymupdf.Point(40, 230), pymupdf.Point(555, 230), color=navy, width=1.5)

    rows = [
        ("Beneficiário:", "Condomínio Edifício Solar"),
        ("CNPJ do Beneficiário:", "03.987.654/0001-21"),
        ("Pagador:", "Magic Space"),
        ("CPF do Pagador:", "***.456.789-**"),
        ("Instituição Emissora:", "Banco Itaú Unibanco S.A."),
        ("Linha Digitável:", "34191.09008 00000.123456 78901.234567 8 98880000045000"),
        ("Canal de Pagamento:", "Internet Banking Mobile"),
        ("Código de Autenticação:", "B7A1.99C4.2210.88FA.KOIN.2026"),
    ]

    y = 260
    for label, val in rows:
        page.insert_text((50, y), label, fontsize=10, color=(0.4, 0.4, 0.4), fontname="helv")
        page.insert_text((220, y), val, fontsize=10, color=dark_gray, fontname="helv")
        y += 28

    path = OUTPUT_DIR / "comprovante_pagamento_boleto.pdf"
    doc.save(str(path))
    doc.close()
    print(f"Gerado: {path}")

if __name__ == "__main__":
    generate_fatura_nubank()
    generate_fatura_inter_protegida()
    generate_cupom_fiscal_png()
    generate_comprovante_pix_png()
    generate_comprovante_boleto()
    print("\nTodos os 5 documentos de teste foram gerados com sucesso em:", OUTPUT_DIR)
