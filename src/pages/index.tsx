export async function getServerSideProps(context: any) {
  return {
    redirect: {
      destination: 'https://fal.ai/models',
      permanent: false,
    }
  }
}

export default function Home() {
  return (
    <div>
      Redirecting...
    </div>
  )
}
