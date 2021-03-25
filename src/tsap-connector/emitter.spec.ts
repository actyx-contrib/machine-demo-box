import { renderTag, renderTags } from './emitter'

describe('tsap-connector', () => {
  describe('emitter', () => {
    it('simple tags renderTag', () => {
      const mk = renderTag('M1', 'id1')
      expect(mk('test').toString()).toBe("'test'")
    })
    it('tag with ID renderTag', () => {
      const mk = renderTag('M1', 'id1')
      expect(mk('test:{id}').toString()).toBe("'test' & 'test:M1'")
    })
    it('tag with uuid renderTag', () => {
      const mk = renderTag('M1', 'id1')
      expect(mk('test:{uuid}').toString()).toBe("'test' & 'test:id1'")
    })
    it('simple tags renderTags', () => {
      const tags = renderTags(['error:{uuid}', 'machine:{id}', 'error_occurred'], 'M1', 'id1')
      expect(tags.toString()).toBe(
        "'error' & 'error:id1' & 'machine' & 'machine:M1' & 'error_occurred'",
      )
    })
  })
})
