// the page of a topic, from the pointer that @ana uses (e.g. "#home")
export const topicPath = (topic: string) => `/topic/${topic.replace(/^#/, '')}`
