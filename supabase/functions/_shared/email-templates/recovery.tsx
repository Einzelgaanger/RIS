/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

const SITE = 'GVTS RIP'

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {SITE}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>{SITE}</Text>
          <Text style={tagline}>Resource Intelligence Platform</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password. Click the button below
          to choose a new one.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Reset Password
          </Button>
        </Section>
        <Text style={hint}>
          This link will expire shortly. If you didn't request a password reset,
          you can safely ignore this email — your password will not be changed.
        </Text>
        <Hr style={divider} />
        <Text style={footer}>© {SITE} · Resource Intelligence Platform</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#f2f4f7', fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif" }
const container = { backgroundColor: '#ffffff', borderRadius: '8px', margin: '40px auto', padding: '0', maxWidth: '480px', border: '1px solid #e2e6ed' }
const header = { padding: '28px 32px 0', textAlign: 'center' as const }
const logo = { fontSize: '20px', fontWeight: '700' as const, color: '#0055B3', margin: '0', letterSpacing: '-0.3px' }
const tagline = { fontSize: '11px', color: '#47536B', margin: '2px 0 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const divider = { borderColor: '#e2e6ed', margin: '20px 32px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#161E2E', margin: '0 32px 16px', padding: '0' }
const text = { fontSize: '14px', color: '#47536B', lineHeight: '1.6', margin: '0 32px 20px' }
const buttonSection = { textAlign: 'center' as const, margin: '8px 32px 24px' }
const button = { backgroundColor: '#0055B3', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 28px', textDecoration: 'none' }
const hint = { fontSize: '12px', color: '#8090a7', lineHeight: '1.5', margin: '0 32px 24px' }
const footer = { fontSize: '11px', color: '#8090a7', textAlign: 'center' as const, margin: '0', padding: '0 32px 28px' }
