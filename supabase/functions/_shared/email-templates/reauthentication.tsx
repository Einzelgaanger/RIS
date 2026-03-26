/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const SITE = 'VGG RIP'
const LOGO_URL = 'https://team-weave-iq.lovable.app/vgg-logo.webp'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for {SITE}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} alt="VGG" width="120" height="40" style={logoImg} />
          <Text style={tagline}>Resource Intelligence Platform</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Verification code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Section style={codeSection}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={hint}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
        <Hr style={divider} />
        <Text style={footer}>© {SITE} · Resource Intelligence Platform</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#f2f4f7', fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif" }
const container = { backgroundColor: '#ffffff', borderRadius: '8px', margin: '40px auto', padding: '0', maxWidth: '480px', border: '1px solid #e2e6ed' }
const header = { padding: '28px 32px 0', textAlign: 'center' as const }
const logoImg = { margin: '0 auto', objectFit: 'contain' as const }
const tagline = { fontSize: '11px', color: '#47536B', margin: '8px 0 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const divider = { borderColor: '#e2e6ed', margin: '20px 32px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#161E2E', margin: '0 32px 16px', padding: '0', fontFamily: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif" }
const text = { fontSize: '14px', color: '#47536B', lineHeight: '1.6', margin: '0 32px 20px' }
const codeSection = { textAlign: 'center' as const, margin: '0 32px 24px', backgroundColor: '#f0f7eb', borderRadius: '8px', padding: '16px', border: '1px solid #d4e8c7' }
const codeStyle = { fontFamily: "'Space Grotesk', Courier, monospace", fontSize: '28px', fontWeight: '700' as const, color: '#4d8c2a', margin: '0', letterSpacing: '4px' }
const hint = { fontSize: '12px', color: '#8090a7', lineHeight: '1.5', margin: '0 32px 24px' }
const footer = { fontSize: '11px', color: '#8090a7', textAlign: 'center' as const, margin: '0', padding: '0 32px 28px' }
